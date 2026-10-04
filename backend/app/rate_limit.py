"""
Rate limiter instance (shared across routers).
Вынесен в отдельный модуль, чтобы избежать circular imports с main.py.
"""
import ipaddress
import math
import time
from collections import OrderedDict
from typing import Callable, List, Optional, Union

from slowapi import Limiter
from starlette.requests import Request

_IP = Union[ipaddress.IPv4Address, ipaddress.IPv6Address]

# Пиры, которым разрешено сообщать реальный IP клиента: loopback, link-local и частные сети
# (в т.ч. bridge-сеть docker compose). Список явный, а не ip.is_private: тот зависит от версии
# Python и включает документационные диапазоны.
_TRUSTED_PEER_NETWORKS = tuple(
    ipaddress.ip_network(net)
    for net in (
        "127.0.0.0/8",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "169.254.0.0/16",
        "::1/128",
        "fc00::/7",
        "fe80::/10",
    )
)


def _parse_ip(value: str) -> Optional[_IP]:
    try:
        ip = ipaddress.ip_address(value.strip())
    except ValueError:
        return None
    # ::ffff:a.b.c.d приводим к IPv4, чтобы mapped-форма не обходила проверку сетей ниже
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        return ip.ipv4_mapped
    return ip


def _is_trusted_peer(ip: _IP) -> bool:
    return any(ip.version == net.version and ip in net for net in _TRUSTED_PEER_NETWORKS)


def _ip_key(ip: _IP) -> str:
    # IPv6-клиенту обычно выдан целый /64: ключ по /128 позволил бы обходить лимит сменой адреса.
    if isinstance(ip, ipaddress.IPv6Address):
        return str(ipaddress.ip_network(f"{ip}/64", strict=False))
    return str(ip)


def get_client_key(request: Request) -> str:
    """
    Ключ лимитера = реальный IP клиента.

    uvicorn запущен без --proxy-headers, поэтому request.client.host за nginx — всегда адрес
    контейнера nginx, и все посетители делили бы один счётчик. nginx на каждом проксируемом
    location перезаписывает X-Real-IP ($remote_addr), но верим заголовку только когда прямой
    пир — loopback/private/docker-сеть: внешний клиент, достучавшийся до backend напрямую,
    подставить X-Real-IP не сможет.
    """
    peer = request.client.host if request.client and request.client.host else "127.0.0.1"
    peer_ip = _parse_ip(peer)
    if peer_ip is None:
        return peer

    if _is_trusted_peer(peer_ip):
        real_ip = _parse_ip(request.headers.get("x-real-ip") or "")
        if real_ip is not None:
            return _ip_key(real_ip)

    return _ip_key(peer_ip)


limiter = Limiter(key_func=get_client_key)


class FailedLoginThrottle:
    """
    Счётчик попыток входа по email (в памяти процесса).

    Лимит по IP не спасает от распределённого перебора пароля одного аккаунта, поэтому
    дополнительно ограничиваем число попыток на email за окно. Попытка учитывается ДО проверки
    пароля (параллельные запросы не проскочат лимит, пока идёт bcrypt), успешный вход
    обнуляет счётчик. Учитываем и несуществующие email, чтобы 429 не выдавал, есть ли аккаунт.

    Ключ — ТОЧНАЯ строка email, по которой login ищет аккаунт (без lower/strip): аккаунты
    сопоставляются с учётом регистра, а /register открыт всем. С нормализацией регистра
    атакующий регистрирует ADMIN@... и своим успешным входом сбрасывал бы счётчик настоящего
    admin@... (reset) — лимит переставал бы работать. Один ключ = один аккаунт.

    Состояние живёт в одном процессе (uvicorn без --workers) и сбрасывается рестартом backend
    (docker compose restart backend снимает блокировку вручную). Память ограничена max_entries.
    Методы синхронные и без await, поэтому атомарны для event loop.
    """

    def __init__(
        self,
        max_attempts: int = 10,
        window_seconds: int = 900,
        max_entries: int = 10_000,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._max_attempts = max_attempts
        self._window = window_seconds
        self._max_entries = max_entries
        self._clock = clock
        # key -> [число попыток, начало окна]. Порядок вставки = порядок начала окон (окно у всех
        # одинаковое, часы монотонные), поэтому истёкшие записи всегда стоят в начале.
        # OrderedDict, а не dict: удаление/чтение с головы за O(1), у обычного dict — деградирует.
        self._entries: "OrderedDict[str, List[float]]" = OrderedDict()
        # Ключи ровно с одной попыткой (самые «слабые»), старые первыми: из них вытесняем при
        # переполнении, не сканируя всю таблицу.
        self._singles: "OrderedDict[str, None]" = OrderedDict()

    def hit(self, email: str) -> int:
        """Регистрирует попытку. 0 — можно проверять пароль, иначе секунд до конца блокировки."""
        key = email
        now = self._clock()
        entry = self._entries.get(key)

        if entry is not None and now - entry[1] >= self._window:
            self._drop(key)
            entry = None

        if entry is None:
            self._make_room(now)
            self._entries[key] = [1, now]
            self._singles[key] = None
            return 0

        if entry[0] >= self._max_attempts:
            return max(1, math.ceil(entry[1] + self._window - now))

        entry[0] += 1
        self._singles.pop(key, None)
        return 0

    def reset(self, email: str) -> None:
        """Успешный вход: счётчик обнуляется."""
        self._drop(email)

    def _drop(self, key: str) -> None:
        self._entries.pop(key, None)
        self._singles.pop(key, None)

    def _make_room(self, now: float) -> None:
        if len(self._entries) < self._max_entries:
            return
        # Истёкшие стоят в начале: снимаем их, пока голова таблицы просрочена (амортизированно O(1))
        while self._entries:
            head, (_, started) = next(iter(self._entries.items()))
            if now - started < self._window:
                break
            self._drop(head)
        if len(self._entries) < self._max_entries:
            return
        # Все записи живые: вытесняем самую слабую (1 попытка, самая старая), чтобы флуд случайными
        # email не сбросил счётчик с уже накопленными попытками по атакуемому аккаунту. Если таких
        # нет — самую старую запись.
        victim = next(iter(self._singles), None)
        if victim is None:
            victim = next(iter(self._entries))
        self._drop(victim)


login_throttle = FailedLoginThrottle()
