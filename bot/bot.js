import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import Student from "../models/studentModel.js";

dotenv.config();

export const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
  polling: true,
});
// Xabar yuborish funksiyasi
export const sendMessageToUser = async (chatId, message) => {
  await bot.sendMessage(chatId, message);
};
// /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await sendMessageToUser(
    chatId,
    "Salom! Telefon raqamingizni yuborish uchun tugmani bosing 📱",
    {
      reply_markup: {
        keyboard: [
          [{ text: "📱 Telefon raqamni yuborish", request_contact: true }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
});

// Kontakt yuborilganda
bot.on("contact", async (msg) => {
  let phoneNumber = msg.contact.phone_number;

  if (!phoneNumber.startsWith("+")) phoneNumber = "+" + phoneNumber;
  if (phoneNumber.length === 9) phoneNumber = "+998" + phoneNumber;

  const chatId = msg.chat.id;

  // student.phone orqali qidirish va chatId saqlash
  const student = await Student.findOneAndUpdate(
    { phone: phoneNumber },
    { chatId: chatId },
    { new: true }
  );

  if (student) {
    await sendMessageToUser(
      chatId,
      `Rahmat ${student.name}! Endi sizga xabar yuborishimiz mumkin ✅`
    );
  } else {
    await sendMessageToUser(chatId, "Telefon raqamingiz bazada topilmadi ❌");
  }
});
