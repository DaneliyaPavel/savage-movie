"""
Rate limiter instance (shared across routers).
Вынесен в отдельный модуль, чтобы избежать circular imports с main.py.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
