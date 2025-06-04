const fetch = require('node-fetch'); // Возможно, вам все еще нужна эта строка, если вы не удалили 'node-fetch' из package.json и используете старую версию Node.js. Если вы обновили, то ее можно удалить.

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST' || !event.body) {
        return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        console.error('JSON parsing error:', error);
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body' }) };
    }

    const { name, phone } = data;

    if (!name || !phone) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Name and Phone are required.' }) };
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    // Получаем строку с ID, разделенными запятыми
    const TELEGRAM_CHAT_IDS_STRING = process.env.TELEGRAM_CHAT_IDS;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_IDS_STRING) {
        console.error('Missing Telegram Bot Token or Chat IDs in environment variables.');
        return { statusCode: 500, body: JSON.stringify({ message: 'Server configuration error.' }) };
    }

    // Разбиваем строку на массив ID, удаляем пробелы и пустые элементы
    const TELEGRAM_CHAT_IDS = TELEGRAM_CHAT_IDS_STRING.split(',').map(id => id.trim()).filter(id => id !== '');

    if (TELEGRAM_CHAT_IDS.length === 0) {
        console.error('No valid Telegram Chat IDs found.');
        return { statusCode: 500, body: JSON.stringify({ message: 'No valid Telegram Chat IDs found.' }) };
    }

    const message = `Нова заявка з сайту:\nІм'я: ${name}\nТелефон: ${phone}`;
    const telegramApiUrlBase = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const results = [];
    for (const chatId of TELEGRAM_CHAT_IDS) {
        try {
            const telegramResponse = await fetch(telegramApiUrlBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: message }),
            });

            const telegramData = await telegramResponse.json();

            if (telegramData.ok) {
                results.push({ chatId, success: true, message: 'Message sent!' });
            } else {
                console.error(`Telegram API error for chat ${chatId}:`, telegramData);
                results.push({ chatId, success: false, message: `Failed: ${telegramData.description || 'Unknown error'}` });
            }
        } catch (error) {
            console.error(`Error sending message to Telegram for chat ${chatId}:`, error);
            results.push({ chatId, success: false, message: 'Internal server error.' });
        }
    }

    // Проверяем, были ли все сообщения успешно отправлены
    const allSuccess = results.every(res => res.success);

    if (allSuccess) {
        return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Messages sent to all specified chats!', results }) };
    } else {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Some messages failed to send.', results }) };
    }
};
