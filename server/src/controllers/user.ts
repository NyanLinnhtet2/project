import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getCentralUserModel } from "../models/CentralDB/user";
import { getCentralBranchModel } from "../models/CentralDB/branches";

interface MulterRequest extends Request {
  file?: {
    filename: string;
    [key: string]: any;
  };
}

// Get all employees
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const CentralUser = getCentralUserModel();

    // Get all users with role employee, manager, cashier, admin
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

// Get employee by ID
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

    // Check if user has valid role
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

// Create new employee
export const createEmployee = async (req: MulterRequest, res: Response) => {
  try {
    const { name, email, phone, position, branch, role, status, password } =
      req.body;

    // Validate required fields
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

    // Check if email already exists
    const existingUser = await CentralUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check if branch exists
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

    // Handle image upload with default values
    let image = {
      url: "",
      public_id: "",
    };

    if (req.file) {
      // If file uploaded, use the file URL
      image = {
        url: `/uploads/${req.file.filename}`,
        public_id: req.file.filename,
      };
    } else {
      // Default image using UI Avatars API
      const encodedName = encodeURIComponent(name);
      image = {
        url: `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&size=128`,
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
      image: image,
      joinDate: new Date(),
    });

    // Remove password from response
    const employeeResponse = newEmployee.toObject();
    delete employeeResponse.password;

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employeeResponse,
    });
  } catch (error: any) {
    // Handle duplicate key error
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
export const updateEmployee = async (req: MulterRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, position, branch, role, status, password } =
      req.body;

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
    };

    // If password is provided, hash it
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Handle image update
    if (req.file) {
      updateData.image = {
        url: `/uploads/${req.file.filename}`,
        public_id: req.file.filename,
      };
    }

    // Update employee
    const updatedEmployee = await CentralUser.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error: any) {
    // Handle duplicate key error
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

    // Check if employee exists
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

    await CentralUser.findByIdAndDelete(id);

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

    const onLeave = await CentralUser.countDocuments({
      role: { $in: ["admin", "manager", "cashier"] },
      status: "suspended",
    });

    // Get role distribution
    const adminCount = await CentralUser.countDocuments({ role: "admin" });
    const managerCount = await CentralUser.countDocuments({ role: "manager" });
    const cashierCount = await CentralUser.countDocuments({ role: "cashier" });

    res.status(200).json({
      success: true,
      message: "Employee stats fetched successfully",
      data: {
        total,
        active,
        inactive,
        onLeave,
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
    const CentralUser = getCentralUserModel();

    // Fix: Properly handle branchName parameter
    if (!branchName) {
      return res.status(400).json({
        success: false,
        message: "Branch name is required",
      });
    }

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
