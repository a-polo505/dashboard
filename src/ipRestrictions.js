import geoip from 'geoip-lite';

// Функція для перевірки IP-адреси користувача
export function checkIPRestrictions(ip) {
    // Визначення місцезнаходження за IP-адресою
    const location = geoip.lookup(ip);

    // Перевірка, чи IP-адреса належить Russian Federation
    if (location && location.country === 'RU') {
        return true; // Доступ заборонено
    } else {
        return false; // Доступ дозволено
    }
}
