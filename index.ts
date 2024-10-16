import 'dotenv/config';
import {TelegramBot} from 'typescript-telegram-bot-api';
import axios from 'axios';


interface Currency {
  ID: string;
  NumCode: string;
  CharCode: string;
  Nominal: number;
  Name: string;
  Value: number;
  Previous: number;
}

interface CBRApiResponse {
  Date: string;
  PreviousDate: string;
  PreviousURL: string;
  Timestamp: string;
  Valute: {
    [key: string]: Currency;
  };
}

const getUSDString = async (): Promise<string> => {
  try {
    const response = await axios.get<CBRApiResponse>('https://www.cbr-xml-daily.ru/daily_json.js');
    const data = response.data;
    const usdRate = data.Valute.USD.Value;
    const emoji = data.Valute.USD.Value > data.Valute.USD.Previous ? '📈' : '📉';

    return `Курс доллара сегодня: ${emoji} ${usdRate.toFixed(2)}₽`;
  } catch (error) {
    throw new Error('Not able to get USD rate');
  }
};

function getGreeting(timezoneOffset: number): string {
  const currentTimeUTC = new Date();
  const currentHour = new Date(
    currentTimeUTC.getTime() + timezoneOffset * 60 * 60 * 1000
  ).getUTCHours();

  if (currentHour >= 5 && currentHour < 12) {
    return 'Доброе утро';
  } else if (currentHour >= 12 && currentHour < 18) {
    return 'Добрый день';
  } else if (currentHour >= 18 && currentHour < 22) {
    return 'Добрый вечер';
  } else {
    return 'Доброй ночи';
  }
}

const bot = new TelegramBot({botToken: process.env.TELEGRAM_BOT_TOKEN});
bot.on('message:text', async (message) => {
  if (message.text === '/start') {
    await bot.sendMessage({
      chat_id: message.chat.id,
      text: `${getGreeting(3)}. Как вас зовут?`,
      reply_markup: {
        keyboard: message.from?.first_name? [[{text: message.from?.first_name}]]: undefined,
        resize_keyboard: true,
        one_time_keyboard: true,
        input_field_placeholder: 'Мое имя',
      }
    });
  } else {
    await bot.sendMessage({
      chat_id: message.chat.id,
      text: `Рад знакомству, ${message.text}! ${await getUSDString()}`
    });
  }
});

bot.startPolling().catch();