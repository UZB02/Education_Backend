import Application from "../models/Application.js";
import Student from "../models/studentModel.js";

export const getByAdmin = async (req, res) => {
  try {
    const applications = await Application.find({ admin: req.params.adminId });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addApplication = async (req, res) => {
  try {
    const app = await Application.create(req.body);
    res.status(201).json(app);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { columnId } = req.body;
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { columnId },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Ariza topilmadi" });
    }

    const oldStatus = application.status;

    // Status active bo'layotgan bo'lsa
    if (status === "active" && oldStatus !== "active") {
      application.columnId = null;
    }

    application.status = status;
    await application.save();

    // Status active bo'lganidan keyin studentga qo'shamiz
    if (status === "active" && oldStatus !== "active") {
      const existingStudent = await Student.findOne({
        applicationId: application._id,
      });

      // Student allaqachon mavjud bo'lmasa, qo'shamiz
      if (!existingStudent) {
        const newStudent = new Student({
          name: application.name,
          lastname: application.lastname,
          phone: application.phone,
          location: application.location,
          groupId: application.groupId,
          description: application.description,
          admin: application.admin,
          applicationId: application._id,
        });

        await newStudent.save();
      }
      await Application.findByIdAndDelete(id);
    }

    res.status(200).json({ message: "Status yangilandi", application });
  } catch (error) {
    console.error("Status yangilash xatosi:", error);
    res.status(500).json({ message: "Server xatosi" });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedApplication = await Application.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Ariza topilmadi" });
    }

    res
      .status(200)
      .json({ message: "Ariza yangilandi", application: updatedApplication });
  } catch (error) {
    console.error("Arizani yangilash xatosi:", error);
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
};