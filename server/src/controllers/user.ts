import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getCentralUserModel } from "../models/CentralDB/user";
import { getCentralBranchModel } from "../models/CentralDB/branches";
import { uploadSingleImage, deleteImage } from "../utils/cloudinary";
import { getBranchConnection } from "../db/db";
import { getBranchEmployeeModel } from "../models/BranchDB/employee";

// Helper: Sync employee to branch database
const syncEmployeeToBranchDB = async (
  branchName: string,
  employeeData: {
    name: string;
    email: string;
    phone: string;
    position: string;
    salary: number;
    status: "active" | "inactive" | "suspended";
    image?: { url: string; public_id: string };
  },
) => {
  try {
    // Get branch from central DB
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: branchName });

    if (!branch) {
      console.error(`Branch not found: ${branchName}`);
      return;
    }

    // Get branch database connection
    const branchDb = getBranchConnection(branch.dbName);
    const BranchEmployee = getBranchEmployeeModel(branchDb);

    // Check if employee exists in branch DB
    const existingEmployee = await BranchEmployee.findOne({
      email: employeeData.email,
    });

    if (existingEmployee) {
      // Update existing employee in branch DB
      await BranchEmployee.findByIdAndUpdate(existingEmployee._id, {
        name: employeeData.name,
        phone: employeeData.phone,
        position: employeeData.position,
        salary: employeeData.salary,
        status: employeeData.status,
        image: employeeData.image || existingEmployee.image,
        updatedAt: new Date(),
      });
      console.log(`✅ Updated employee in branch DB: ${employeeData.email}`);
    } else {
      // Create new employee in branch DB
      await BranchEmployee.create({
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone,
        position: employeeData.position,
        salary: employeeData.salary,
        status: employeeData.status,
        image: employeeData.image || { url: "", public_id: "" },
        joinDate: new Date(),
      });
      console.log(`✅ Created employee in branch DB: ${employeeData.email}`);
    }
  } catch (error) {
    console.error(`Error syncing employee to branch DB:`, error);
    // Don't throw - sync failure shouldn't break the main operation
  }
};

// Helper: Delete employee from branch database
const deleteEmployeeFromBranchDB = async (
  branchName: string,
  email: string,
) => {
  try {
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: branchName });

    if (!branch) {
      console.error(`Branch not found: ${branchName}`);
      return;
    }

    const branchDb = getBranchConnection(branch.dbName);
    const BranchEmployee = getBranchEmployeeModel(branchDb);

    await BranchEmployee.findOneAndDelete({ email });
    console.log(`✅ Deleted employee from branch DB: ${email}`);
  } catch (error) {
    console.error(`Error deleting employee from branch DB:`, error);
  }
};

// Helper: Remove employee from old branch when branch changes
const removeEmployeeFromOldBranch = async (
  oldBranchName: string,
  email: string,
) => {
  try {
    const Branch = getCentralBranchModel();
    const branch = await Branch.findOne({ name: oldBranchName });

    if (!branch) {
      console.error(`Old branch not found: ${oldBranchName}`);
      return;
    }

    const branchDb = getBranchConnection(branch.dbName);
    const BranchEmployee = getBranchEmployeeModel(branchDb);

    await BranchEmployee.findOneAndDelete({ email });
    console.log(`✅ Removed employee from old branch DB: ${email}`);
  } catch (error) {
    console.error(`Error removing employee from old branch DB:`, error);
  }
};

// Helper: Update branch manager
const updateBranchManager = async (
  branchName: string,
  managerName: string,
  previousManagerName?: string,
) => {
  try {
    const Branch = getCentralBranchModel();

    // If there was a previous manager, set their branch's manager to "Not Assigned"
    if (previousManagerName) {
      await Branch.findOneAndUpdate(
        { manager: previousManagerName },
        { manager: "Not Assigned" },
      );
      console.log(`✅ Removed previous manager: ${previousManagerName}`);
    }

    // Set new manager
    await Branch.findOneAndUpdate(
      { name: branchName },
      { manager: managerName },
    );
    console.log(`✅ Updated branch manager: ${branchName} -> ${managerName}`);
  } catch (error) {
    console.error(`Error updating branch manager:`, error);
  }
};

// Get all employees (with branch DB stats)
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const CentralUser = getCentralUserModel();

    const employees = await CentralUser.find({
      role: { $in: ["admin", "manager", "cashier"] },
      position: { $ne: "System Administrator" },
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

    // Create new employee in Central DB
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

    // ✅ Sync employee to branch database
    await syncEmployeeToBranchDB(branch, {
      name,
      email,
      phone,
      position,
      salary: salary || 0,
      status: status || "active",
      image,
    });

    // ✅ If role is manager, update branch manager
    if (role === "manager") {
      // Check if branch already has a manager
      const existingBranch = await Branch.findOne({ name: branch });
      const previousManager = existingBranch?.manager;

      // If there was a previous manager, set them to "Not Assigned"
      if (previousManager && previousManager !== "Not Assigned") {
        await updateBranchManager(branch, newEmployee.name, previousManager);
      } else {
        await updateBranchManager(branch, newEmployee.name);
      }
    }

    const employeeResponse = newEmployee.toObject();
    delete (employeeResponse as any).password;

    res.status(201).json({
      success: true,
      message: "Employee created successfully and synced to branch",
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
    const Branch = getCentralBranchModel();
    const oldBranch = employee.branch; // Save old branch name
    const oldRole = employee.role; // Save old role

    if (branch) {
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

    // Handle image update with Cloudinary
    if (avatar) {
      try {
        if (
          employee.image?.public_id &&
          !employee.image.public_id.startsWith("default_")
        ) {
          await deleteImage(employee.image.public_id);
        }

        const uploadedImage = await uploadSingleImage(avatar, "employees");
        updateData.image = {
          url: uploadedImage.image_url,
          public_id: uploadedImage.public_id,
        };
      } catch (error: any) {
        if (error.message.includes("exceeds maximum allowed size")) {
          return res.status(413).json({
            success: false,
            message: error.message,
          });
        }
        console.error("Image upload failed:", error);
      }
    }

    // Update employee in Central DB
    const updatedEmployee = await CentralUser.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    // ✅ If branch changed, remove from old branch and add to new branch
    if (branch && branch !== oldBranch) {
      // Remove from old branch DB
      await removeEmployeeFromOldBranch(oldBranch, employee.email);

      // Add to new branch DB
      await syncEmployeeToBranchDB(branch, {
        name: name || employee.name,
        email: email || employee.email,
        phone: phone || employee.phone,
        position: position || employee.position,
        salary: salary || employee.salary || 0,
        status: status || employee.status,
        image: updateData.image || employee.image,
      });
    } else {
      // If branch not changed, just update in same branch
      const branchName = branch || oldBranch;
      await syncEmployeeToBranchDB(branchName, {
        name: name || employee.name,
        email: email || employee.email,
        phone: phone || employee.phone,
        position: position || employee.position,
        salary: salary || employee.salary || 0,
        status: status || employee.status,
        image: updateData.image || employee.image,
      });
    }

    // ✅ Handle role changes for manager
    const targetBranch = branch || oldBranch;

    // Case 1: Employee becomes a manager
    if (role === "manager" && oldRole !== "manager") {
      // Check if target branch already has a manager
      const existingBranch = await Branch.findOne({ name: targetBranch });
      const previousManager = existingBranch?.manager;

      // If there was a previous manager, set them to "Not Assigned"
      if (previousManager && previousManager !== "Not Assigned") {
        await updateBranchManager(
          targetBranch,
          name || employee.name,
          previousManager,
        );
      } else {
        await updateBranchManager(targetBranch, name || employee.name);
      }
    }

    // Case 2: Employee was a manager but no longer is
    else if (oldRole === "manager" && role !== "manager") {
      // Remove manager from their old branch
      await Branch.findOneAndUpdate(
        { name: oldBranch },
        { manager: "Not Assigned" },
      );
      console.log(`✅ Removed manager from branch: ${oldBranch}`);
    }

    // Case 3: Employee is a manager and branch changed
    else if (
      role === "manager" &&
      oldRole === "manager" &&
      branch &&
      branch !== oldBranch
    ) {
      // Remove from old branch
      await Branch.findOneAndUpdate(
        { name: oldBranch },
        { manager: "Not Assigned" },
      );

      // Add to new branch
      const existingBranch = await Branch.findOne({ name: branch });
      const previousManager = existingBranch?.manager;

      if (previousManager && previousManager !== "Not Assigned") {
        await updateBranchManager(
          branch,
          name || employee.name,
          previousManager,
        );
      } else {
        await updateBranchManager(branch, name || employee.name);
      }
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully and synced to branch",
      data: updatedEmployee,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (
      error.message?.includes("request entity too large") ||
      error.type === "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Image file is too large. Maximum size allowed is 5MB. Please compress your image and try again.",
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

    // Delete image from Cloudinary if not default
    if (
      employee.image?.public_id &&
      !employee.image.public_id.startsWith("default_")
    ) {
      await deleteImage(employee.image.public_id);
    }

    // ✅ Delete employee from branch database (using the employee's current branch)
    await deleteEmployeeFromBranchDB(employee.branch, employee.email);

    // Delete from Central DB
    await CentralUser.findByIdAndDelete(id);

    // ✅ If employee was manager, update branch manager to "Not Assigned"
    if (employee.role === "manager") {
      const Branch = getCentralBranchModel();
      await Branch.findOneAndUpdate(
        { name: employee.branch },
        { manager: "Not Assigned" },
      );
      console.log(`✅ Removed manager from branch: ${employee.branch}`);
    }

    res.status(200).json({
      success: true,
      message:
        "Employee deleted successfully from central and branch databases",
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (
      error.message?.includes("request entity too large") ||
      error.type === "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Image file is too large. Maximum size allowed is 5MB. Please compress your image and try again.",
      });
    }
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
      position: { $ne: "System Administrator" },
    });

    const active = await CentralUser.countDocuments({
      role: { $in: ["admin", "manager", "cashier"] },
      position: { $ne: "System Administrator" },
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

    // ✅ Sync status update to branch database
    await syncEmployeeToBranchDB(employee.branch, {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      salary: employee.salary || 0,
      status: status,
      image: employee.image,
    });

    res.status(200).json({
      success: true,
      message: "Employee status updated successfully and synced to branch",
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update employee status",
    });
  }
};

export const getManagersForDropdown = async (req: Request, res: Response) => {
  try {
    const CentralUser = getCentralUserModel();

    const managers = await CentralUser.find({
      role: "manager",
      status: "active",
    }).select("name email branch");

    return res.status(200).json({
      success: true,
      data: managers,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch managers",
    });
  }
};
