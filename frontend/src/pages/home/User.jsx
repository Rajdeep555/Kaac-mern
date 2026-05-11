import { useEffect, useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { Loader } from "../../components/ui/Loader.jsx";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
} from "../../api/user.api.js";

const User = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    userId: null,
    isActive: null,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    // ✅ Don't pre-fill password for security
    setEditingUser({ ...user, password: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (userId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate User?" : "Reactivate User?",
      message: isActive
        ? "This user will be marked as inactive and cannot log in."
        : "This user will be reactivated and can log in again.",
      onConfirm: () => handleToggleStatus(userId, isActive),
      userId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(async (userId, isActive) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !isActive } : u)),
      );
      showToast(
        isActive ? "User deactivated!" : "User reactivated!",
        "success",
      );
      setAlertModal((prev) => ({ ...prev, open: false }));
    } catch (error) {
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }, []);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    try {
      // ✅ Strip empty password on update
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete payload.password;
      }

      let res;
      if (editingUser) {
        res = await updateUser(editingUser.id, payload);
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? res.data.user : u)),
        );
        showToast("User updated successfully!", "success");
      } else {
        res = await createUser(payload);
        setUsers((prev) => [...prev, res.data.user]);
        showToast("User created successfully!", "success");
      }

      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message || error.message || "Operation failed";
      setFormError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}>
          {value}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => {
        const isLoading = actionLoading[row.id];
        const isActive = row.isActive;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(row)}
              disabled={isLoading}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors disabled:opacity-50"
              title="Edit">
              <AiFillEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAlertModal(row.id, isActive)}
              disabled={isLoading}
              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                isActive
                  ? "text-red-600 hover:bg-red-100"
                  : "text-green-600 hover:bg-green-100"
              }`}
              title={isActive ? "Deactivate" : "Reactivate"}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isActive ? (
                <MdDelete className="w-4 h-4" />
              ) : (
                <MdRestore className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const userFormFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
      required: true,
    },
    {
      name: "password",
      label: editingUser ? "New Password (leave blank to keep)" : "Password",
      type: "password",
      placeholder: editingUser
        ? "Leave blank to keep current"
        : "Enter password",
      required: !editingUser, // ✅ required only on create
    },
    {
      name: "role",
      label: "Role",
      type: "select",
      placeholder: "Select role",
      required: true,
      options: [
        { label: "Cashier", value: "CASHIER" },
        { label: "Admin", value: "ADMIN" },
      ],
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">User Management</h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            data={users}
            columns={columns}
            searchableKeys={["name", "email", "role"]}
            statusKey="isActive"
            pageSize={10}
            loading={loading}
            downloadFileName="users"
            printTitle="User Report"
            actionSlot={
              <TableButton
                name="Add New User"
                onClick={() => {
                  setEditingUser(null);
                  setFormError("");
                  setIsModalOpen(true);
                }}
              />
            }
          />
        )}
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          fields={userFormFields}
          initialValues={editingUser}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          title={editingUser ? "Edit User" : "Add New User"}
          loading={saving}
          error={formError}
          onSubmit={handleSubmit}
        />
      )}

      <AlertModal
        isOpen={alertModal.open}
        onClose={() => setAlertModal((prev) => ({ ...prev, open: false }))}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        confirmText={alertModal.isActive ? "Deactivate" : "Reactivate"}
        loading={actionLoading[alertModal.userId]}
      />
    </>
  );
};

export default User;
