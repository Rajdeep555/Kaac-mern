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
  getExpenditureTypes,
  createExpenditureType,
  updateExpenditureType,
  toggleExpenditureTypeStatus,
} from "../../api/expenditureType.api.js";

const ExpenditureType = () => {
  const [expenditureTypes, setExpenditureTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    itemId: null,
    isActive: null,
  });

  useEffect(() => {
    fetchExpenditureTypes();
  }, []);

  const fetchExpenditureTypes = async () => {
    try {
      setLoading(true);
      const res = await getExpenditureTypes();
      setExpenditureTypes(res.data.expenditureTypes);
    } catch (error) {
      console.error("Error fetching expenditure types:", error);
      showToast("Failed to load expenditure types", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (itemId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive
        ? "Deactivate Expenditure Type?"
        : "Reactivate Expenditure Type?",
      message: isActive
        ? "This expenditure type will be marked as inactive."
        : "This expenditure type will be marked as active again.",
      onConfirm: () => handleToggleStatus(itemId, isActive),
      itemId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(async (itemId, isActive) => {
    setActionLoading((prev) => ({ ...prev, [itemId]: true }));
    try {
      await toggleExpenditureTypeStatus(itemId);
      setExpenditureTypes((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isActive: !isActive } : item,
        ),
      );
      showToast(
        isActive
          ? "Expenditure type deactivated!"
          : "Expenditure type reactivated!",
        "success",
      );
      setAlertModal((prev) => ({ ...prev, open: false }));
    } catch (error) {
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [itemId]: false }));
    }
  }, []);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    try {
      let res;
      if (editingItem) {
        res = await updateExpenditureType(editingItem.id, formData);
        setExpenditureTypes((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? res.data.expenditureType : item,
          ),
        );
        showToast("Expenditure type updated successfully!", "success");
      } else {
        res = await createExpenditureType(formData);
        setExpenditureTypes((prev) => [...prev, res.data.expenditureType]);
        showToast("Expenditure type added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditingItem(null);
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

  const formFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter expenditure type name",
      required: true,
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
          Expenditure Type Management
        </h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            data={expenditureTypes}
            columns={columns}
            searchableKeys={["name", "sector"]}
            statusKey="isActive"
            pageSize={10}
            loading={loading}
            downloadFileName="expenditure-types"
            printTitle="Expenditure Type Report"
            actionSlot={
              <TableButton
                name="Add New Type"
                onClick={() => {
                  setEditingItem(null);
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
          fields={formFields}
          initialValues={editingItem}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          title={
            editingItem ? "Edit Expenditure Type" : "Add New Expenditure Type"
          }
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
        loading={actionLoading[alertModal.itemId]}
      />
    </>
  );
};

export default ExpenditureType;
