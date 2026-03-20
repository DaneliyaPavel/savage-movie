#!/bin/bash
set -e

# Скрипт для первоначальной настройки SSL с Cloudflare Origin Certificate
# Использование: ./scripts/init-ssl.sh

SSL_DIR="$(cd "$(dirname "$0")/.." && pwd)/infra/ssl"

echo "=== Настройка SSL для savagemovie.ru ==="
echo ""

# Создать директорию для сертификатов
mkdir -p "$SSL_DIR"

# Проверить наличие файлов
if [ -f "$SSL_DIR/origin.pem" ] && [ -f "$SSL_DIR/origin-key.pem" ]; then
    echo "✓ Сертификаты уже на месте:"
    echo "  - $SSL_DIR/origin.pem"
    echo "  - $SSL_DIR/origin-key.pem"
    echo ""
    echo "Для пересоздания удалите файлы и запустите скрипт заново."
    exit 0
fi

echo "Для получения Cloudflare Origin Certificate:"
echo ""
echo "1. Откройте Cloudflare Dashboard → savagemovie.ru"
echo "2. SSL/TLS → Origin Server → Create Certificate"
echo "3. Тип: RSA (2048)"
echo "4. Hostnames: savagemovie.ru, *.savagemovie.ru"
echo "5. Срок: 15 лет"
echo "6. Нажмите Create"
echo ""
echo "7. Скопируйте Origin Certificate в файл:"
echo "   $SSL_DIR/origin.pem"
echo ""
echo "8. Скопируйте Private Key в файл:"
echo "   $SSL_DIR/origin-key.pem"
echo ""

# Интерактивное создание файлов
read -p "Хотите вставить сертификаты сейчас? (y/n): " REPLY
if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
    echo ""
    echo "Вставьте Origin Certificate (завершите вводом Ctrl+D):"
    cat > "$SSL_DIR/origin.pem"
    echo ""

    echo "Вставьте Private Key (завершите вводом Ctrl+D):"
    cat > "$SSL_DIR/origin-key.pem"
    echo ""

    chmod 600 "$SSL_DIR/origin-key.pem"
    echo "✓ Сертификаты сохранены и права установлены."
else
    echo "Создайте файлы вручную и запустите скрипт снова для проверки."
    exit 1
fi

echo ""
echo "=== Готово! ==="
echo ""
echo "Следующие шаги:"
echo "1. docker compose up -d"
echo "2. В Cloudflare: включите оранжевое облако (Proxy) для DNS записей"
echo "3. В Cloudflare: SSL/TLS → режим Full (Strict)"
echo "4. Проверьте: curl -I https://savagemovie.ru"
