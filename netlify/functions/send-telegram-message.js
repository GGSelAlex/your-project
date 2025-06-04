const fetch = require('node-fetch'); // Для виконання HTTP-запитів до API Telegram

exports.handler = async function(event, context) {
    // Перевіряємо, чи це POST-запит і чи є тіло
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        console.error('JSON parsing error:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON body' }),
        };
    }

    const { name, phone } = data; // Отримуємо ім'я та телефон з тіла запиту

    if (!name || !phone) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Name and Phone are required.' }),
        };
    }

    // ВАШІ СЕКРЕТНІ КЛЮЧІ - ВАЖЛИВО: НІКОЛИ НЕ ЗАЛИШАЙТЕ ЇХ ТУТ ВІДКРИТИМИ!
    // Ці змінні будуть завантажені з налаштувань Netlify (Environment Variables)
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Telegram API Token or Chat ID not set in environment variables.');
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error.' }),
        };
    }

    const message = `Нова заявка з сайту:\nІм'я: ${name}\nТелефон: ${phone}`;
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const telegramResponse = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
            }),
        });

        const telegramData = await telegramResponse.json();

        if (telegramData.ok) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Message sent to Telegram!' }),
            };
        } else {
            console.error('Telegram API error:', telegramData);
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: `Failed to send message to Telegram: ${telegramData.description || 'Unknown error'}` }),
            };
        }
    } catch (error) {
        console.error('Error sending message to Telegram:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Internal server error.' }),
        };
    }
};