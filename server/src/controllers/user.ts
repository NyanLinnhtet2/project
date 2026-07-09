import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getCentralUserModel } from "../models/CentralDB/user";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { uploadSingleImage, deleteImage } from "../utils/cloudinary";

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const CentralUser = getCentralUserModel();

    const employees = await CentralUser.find({
      role: { $in: ["admin", "manager", "cashier"] },
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch employees",
    });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const CentralUser = getCentralUserModel();

    const employee = await CentralUser.findById(id).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (!["admin", "manager", "cashier"].includes(employee.role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee role",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch employee",
    });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      position,
      branch,
      role,
      status,
      password,
      salary,
      avatar,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !position ||
      !branch ||
      !role ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    const CentralUser = getCentralUserModel();
    const Branch = getCentralBranchModel();

    const existingUser = await CentralUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const branchExists = await Branch.findOne({ name: branch });
    if (!branchExists) {
      return res.status(400).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let image = { url: "", public_id: "" };

    if (avatar) {
      try {
        const uploadedImage = await uploadSingleImage(avatar, "employees");
        image = {
          url: uploadedImage.image_url,
          public_id: uploadedImage.public_id,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
        // Continue with default avatar if upload fails
      }
    }

    // If no image uploaded, use default avatar
    if (!image.url) {
      const encodedName = encodeURIComponent(name);
      image = {
        url: `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&size=256`,
        public_id: `default_${Date.now()}`,
      };
    }

    // Create new employee
    const newEmployee = await CentralUser.create({
      name,
      email,
      phone,
      position,
      branch,
      role,
      status: status || "active",
      password: hashedPassword,
      salary: salary || 0,
      image: image,
      joinDate: new Date(),
    });

    // If role is manager, update branch manager
    if (role === "manager") {
      await Branch.findOneAndUpdate(
        { name: branch },
        { manager: newEmployee.name },
      );
    }

    const employeeResponse = newEmployee.toObject();
    delete (employeeResponse as any).password;

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employeeResponse,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create employee",
    });
  }
};

// Update employee
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      position,
      branch,
      role,
      status,
      password,
      salary,
      avatar,
    } = req.body;

    const CentralUser = getCentralUserModel();

    // Check if employee exists
    const employee = await CentralUser.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if email is being changed and already exists
    if (email && email !== employee.email) {
      const existingUser = await CentralUser.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // If branch is being updated, check if branch exists
    if (branch) {
      const Branch = getCentralBranchModel();
      const branchExists = await Branch.findOne({ name: branch });
      if (!branchExists) {
        return res.status(400).json({
          success: false,
          message: "Branch not found",
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      phone,
      position,
      branch,
      role,
      status,
      salary: salary || 0,
    };

    // If password is provided, hash it
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // ✅ Handle image update with Cloudinary
    if (avatar) {
      try {
        // Delete old image if exists and not default
        if (
          employee.image?.public_id &&
          !employee.image.public_id.startsWith("default_")
        ) {
          await deleteImage(employee.image.public_id);
        }

        // Upload new image
        const uploadedImage = await uploadSingleImage(avatar, "employees");
        updateData.image = {
          url: uploadedImage.image_url,
          public_id: uploadedImage.public_id,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
        // Keep existing image if upload fails
      }
    }

    // Update employee
    const updatedEmployee = await CentralUser.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    // If role changed to manager, update branch manager
    if (role === "manager" && branch) {
      const Branch = getCentralBranchModel();
      await Branch.findOneAndUpdate({ name: branch }, { manager: name });
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update employee",
    });
  }
};

// Delete employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const CentralUser = getCentralUserModel();

    const employee = await CentralUser.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Prevent deleting the last admin
    if (employee.role === "admin") {
      const adminCount = await CentralUser.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last admin user",
        });
      }
    }

    // ✅ Delete image from Cloudinary if not default
    if (
      employee.image?.public_id &&
      !employee.image.public_id.startsWith("default_")
    ) {
      await deleteImage(employee.image.public_id);
    }

    await CentralUser.findByIdAndDelete(id);

    // If employee was manager, update branch
    if (employee.role === "manager") {
      const Branch = getCentralBranchModel();
      await Branch.findOneAndUpdate(
        { name: employee.branch },
        { manager: "Not Assigned" },
      );
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete employee",
    });
  }
};

// Get employee stats
export const getEmployeeStats = async (req: Request, res: Response) => {
  try {
    const CentralUser = getCentralUserModel();

    const total = await CentralUser.countDocuments({
      role: { $in: ["admin", "manager", "cashier"] },
    });

    const active = await CentralUser.countDocuments({
      role: { $in: ["admin", "manager", "cashier"] },
      status: "active",
    });

    const inactive = await CentralUser.countDocuments({
      role: { $in: ["admin", "manager", "cashier"] },
      status: "inactive",
    });

    const suspended = await CentralUser.countDocuments({
      role: { $in: ["admin", "manager", "cashier"] },
      status: "suspended",
    });

    const adminCount = await CentralUser.countDocuments({ role: "admin" });
    const managerCount = await CentralUser.countDocuments({ role: "manager" });
    const cashierCount = await CentralUser.countDocuments({ role: "cashier" });

    // Total salary
    const totalSalary = await CentralUser.aggregate([
      { $match: { role: { $in: ["admin", "manager", "cashier"] } } },
      { $group: { _id: null, total: { $sum: "$salary" } } },
    ]);

    res.status(200).json({
      success: true,
      message: "Employee stats fetched successfully",
      data: {
        total,
        active,
        inactive,
        suspended,
        totalSalary: totalSalary[0]?.total || 0,
        roles: {
          admin: adminCount,
          manager: managerCount,
          cashier: cashierCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch employee stats",
    });
  }
};

// Get employees by branch
export const getEmployeesByBranch = async (req: Request, res: Response) => {
  try {
    const { branchName } = req.params;

    if (!branchName) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

    const CentralUser = getCentralUserModel();

    const employees = await CentralUser.find({
      branch: branchName,
      role: { $in: ["admin", "manager", "cashier"] },
    }).select("-password");

    res.status(200).json({
      success: true,
      message: `Employees in ${branchName} fetched successfully`,
      data: employees,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch employees by branch",
    });
  }
};

// Update employee status
export const updateEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, inactive, or suspended",
      });
    }

    const CentralUser = getCentralUserModel();

    const employee = await CentralUser.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update employee status",
    });
  }
};
