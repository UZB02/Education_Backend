import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import Teacher from "../models/teacherModel.js";

dotenv.config();
console.log("TEACHER BOT TOKEN:", process.env.TEACHER_BOT_TOKEN);

export const bot = new TelegramBot(process.env.TEACHER_BOT_TOKEN, {
  polling: true,
});

// Xabar yuborish funksiyasi
export const sendMessageToTeacher = async (chatId, message, options = {}) => {
  await bot.sendMessage(chatId, message, options);
};

// =============================
// /start — Teacher start
// =============================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await sendMessageToTeacher(
    chatId,
    "Assalomu alaykum, hurmatli o‘qituvchi! 👨‍🏫\nTelefon raqamni yuborish tugmasini bosing!",
    {
      reply_markup: {
        keyboard: [
          [{ text: "📱 Telefon raqamni yuborish", request_contact: true }],
          [{ text: "🔑 Parolni olish" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    }
  );
});

// =============================
// /teacher — Alternativ start
// =============================
bot.onText(/\/teacher/, async (msg) => {
  const chatId = msg.chat.id;

  await sendMessageToTeacher(
    chatId,
    "👨‍🏫 O‘qituvchilar uchun tizimga xush kelibsiz!\nTelefon raqamingizni yuboring yoki parolni olish tugmasini bosing:",
    {
      reply_markup: {
        keyboard: [
          [{ text: "📱 Telefon raqamni yuborish", request_contact: true }],
          [{ text: "🔑 Parolni olish" }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    }
  );
});

// =============================
// Kontakt yuborilganda
// =============================
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  let phoneNumber = msg.contact.phone_number;

  // Formatlash
  if (!phoneNumber.startsWith("+")) phoneNumber = "+" + phoneNumber;
  if (phoneNumber.length === 9) phoneNumber = "+998" + phoneNumber;

  await sendTeacherPassword(chatId, phoneNumber);
});

// =============================
// Tugma bosilganda (message)
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "🔑 Parolni olish") {
    // chatId bilan Teacherni topish
    const teacher = await Teacher.findOne({ chatId });

    if (!teacher) {
      return sendMessageToTeacher(
        chatId,
        "❌ Sizning chat bazada topilmadi. Iltimos, avval telefon raqamingizni yuboring."
      );
    }

    await sendMessageToTeacher(
      chatId,
      `🔑 Sizning parolingiz: <b>${teacher.password}</b>`,
      { parse_mode: "HTML" }
    );
  }
});

// =============================
// Parolni yuborish funksiyasi
// =============================
const sendTeacherPassword = async (chatId, phoneNumber) => {
  const teacher = await Teacher.findOne({ phone: phoneNumber });

  if (!teacher) {
    return sendMessageToTeacher(
      chatId,
      "❌ Telefon raqamingiz o‘qituvchilar bazasida topilmadi."
    );
  }

  // chatId saqlash
  teacher.chatId = chatId;
  await teacher.save();

  await sendMessageToTeacher(
    chatId,
    `Assalomu alaykum, <b>${teacher.name} ${teacher.lastname}</b>!\nSizning parolingiz:\n<b>${teacher.password}</b>`,
    { parse_mode: "HTML" }
  );
};
