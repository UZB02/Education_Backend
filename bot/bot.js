import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import Student from "../models/studentModel.js";

dotenv.config();

export const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
  polling: true,
});

// Xabar yuborish funksiyasi
export const sendMessageToUser = async (chatId, message, options = {}) => {
  await bot.sendMessage(chatId, message, options);
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

  // 1) Avval phone orqali qidiramiz
  let student = await Student.findOne({ parentPhone: phoneNumber });

  // 3) Agar umuman topilmasa
  if (!student) {
    return sendMessageToUser(chatId, "Telefon raqamingiz bazada topilmadi ❌");
  }

  // 4) chatId yangilash
  student.chatId = chatId;
  await student.save();

  let realPassword = student.password;

  await sendMessageToUser(
    chatId,
    `Assalomu alaykum, ${student.name}!\nSizning parolingiz: <b>${realPassword}</b>`,
    { parse_mode: "HTML" }
  );
});
