import { useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { useAllDepartments } from "../../hooks/useAllDepartments";
import {
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} from "../../api/department.api";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";

const Department = () => {
  const { departments, setDepartments, loading, error } = useAllDepartments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    deptId: null,
    isActive: null,
  });

  const handleEdit = (dept) => {
    setEditingDepartment(dept);
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (deptId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate Department?" : "Reactivate Department?",
      message: isActive
        ? "This department will be marked as inactive."
        : "This department will be marked as active again.",
      onConfirm: () => handleToggleStatus(deptId, isActive),
      deptId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(
    async (deptId, isActive) => {
      setActionLoading((prev) => ({ ...prev, [deptId]: true }));
      try {
        await toggleDepartmentStatus(deptId);
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === deptId ? { ...d, isActive: !isActive } : d,
          ),
        );
        showToast(
          isActive ? "Department deactivated!" : "Department reactivated!",
          "success",
        );
        setAlertModal((prev) => ({ ...prev, open: false }));
      } catch (error) {
        showToast("Operation failed", "error");
      } finally {
        setActionLoading((prev) => ({ ...prev, [deptId]: false }));
      }
    },
    [setDepartments],
  );

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    try {
      let res;
      if (editingDepartment) {
        res = await updateDepartment(editingDepartment.id, formData);
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editingDepartment.id ? res.data.department : d,
          ),
        );
        showToast("Department updated successfully!", "success");
      } else {
        res = await createDepartment(formData);
        setDepartments((prev) => [...prev, res.data.department]);
        showToast("Department added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditingDepartment(null);
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
    { key: "code", label: "Code" },
    { key: "sector", label: "Sector" },
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
              onClick={() => openAlertModal(row.id, row.isActive)}
              disabled={isLoading}
              className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                row.isActive
                  ? "text-red-600 hover:bg-red-100"
                  : "text-green-600 hover:bg-green-100"
              }`}
              title={row.isActive ? "Deactivate" : "Reactivate"}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : row.isActive ? (
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

  // ✅ Code field disabled when editing (code should never change)
  const departmentFormFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
      required: true,
    },
    {
      name: "code",
      label: "Code",
      type: "text",
      placeholder: "Enter code",
      required: !editingDepartment,
      disabled: !!editingDepartment,
    },
    {
      name: "sector",
      label: "Sector",
      type: "select",
      placeholder: "Select sector",
      options: [
        { label: "Council", value: "COUNCIL" },
        { label: "State", value: "STATE" },
      ],
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          Department Management
        </h1>

        {error && (
          <p className="text-red-600 text-sm">Failed to load departments.</p>
        )}

        <DataTable
          data={departments}
          columns={columns}
          searchableKeys={["name", "code", "sector"]}
          statusKey="isActive"
          pageSize={40}
          loading={loading}
          downloadFileName="departments"
          printTitle="Department Report"
          actionSlot={
            <TableButton
              name="Add New Department"
              onClick={() => {
                setEditingDepartment(null);
                setFormError("");
                setIsModalOpen(true);
              }}
            />
          }
        />
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          fields={departmentFormFields}
          initialValues={editingDepartment}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingDepartment(null);
          }}
          title={editingDepartment ? "Edit Department" : "Add New Department"}
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
        loading={actionLoading[alertModal.deptId]}
      />
    </>
  );
};

export default Department;
