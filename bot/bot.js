import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import Student from "../models/studentModel.js"; // modelni chaqiramiz

dotenv.config();

export const bot = new TelegramBot("8297536841:AAHimnbzl6Ru9u8Gvks0uhvYdX8dGOGKFwU", {
  polling: true,
});

// /start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
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

  // Telefon raqamni +998 formatiga keltirish
  if (!phoneNumber.startsWith("+")) {
    phoneNumber = "+" + phoneNumber;
  }

  // Agar faqat 9 xonali raqam bo'lsa, oldiga +998 qo'shamiz
  if (phoneNumber.length === 9) {
    phoneNumber = "+998" + phoneNumber;
  }

  const chatId = msg.chat.id;

  const student = await Student.findOneAndUpdate(
    { phone: phoneNumber },
    { chatId: chatId },
    { new: true }
  );

  if (student) {
    bot.sendMessage(
      chatId,
      `Rahmat ${student.name}! Endi sizga xabar yuborishimiz mumkin ✅`
    );
  } else {
    bot.sendMessage(chatId, "Telefon raqamingiz bazada topilmadi ❌");
  }
});


// Xabar yuborish funksiyasi
export const sendMessageToUser = async (chatId, message) => {
  await bot.sendMessage(chatId, message);
};
