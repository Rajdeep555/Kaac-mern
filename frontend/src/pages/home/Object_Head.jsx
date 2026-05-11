import { useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import { useObjectHead } from "../../hooks/useObjectHead.js";
import {
  createObjectHead,
  updateObjectHead,
  toggleObjectHeadStatus,
} from "../../api/objectHead.api.js";

const Object_Head = () => {
  const { objectHeads, setObjectHeads, loading, error } = useObjectHead();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    itemId: null,
    isActive: null,
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (itemId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate Object Head?" : "Reactivate Object Head?",
      message: isActive
        ? "This object head will be marked as inactive."
        : "This object head will be marked as active again.",
      onConfirm: () => handleToggleStatus(itemId, isActive),
      itemId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(
    async (itemId, isActive) => {
      setActionLoading((prev) => ({ ...prev, [itemId]: true }));
      try {
        await toggleObjectHeadStatus(itemId);
        setObjectHeads((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, isActive: !isActive } : item,
          ),
        );
        showToast(
          isActive ? "Object Head deactivated!" : "Object Head reactivated!",
          "success",
        );
        setAlertModal((prev) => ({ ...prev, open: false }));
      } catch (error) {
        showToast("Operation failed", "error");
      } finally {
        setActionLoading((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [setObjectHeads],
  );

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    try {
      let res;
      if (editingItem) {
        res = await updateObjectHead(editingItem.id, formData);
        setObjectHeads((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? res.data.objectHead : item,
          ),
        );
        showToast("Object Head updated successfully!", "success");
      } else {
        res = await createObjectHead(formData);
        setObjectHeads((prev) => [...prev, res.data.objectHead]);
        showToast("Object Head added successfully!", "success");
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

  const objectHeadFormFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter object head name",
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
          Object Head Management
        </h1>

        {error && (
          <p className="text-red-600 text-sm">Failed to load object heads.</p>
        )}

        <DataTable
          data={objectHeads}
          columns={columns}
          loading={loading}
          searchableKeys={["name", "sector"]}
          statusKey="isActive"
          pageSize={10}
          downloadFileName="object-heads"
          printTitle="Object Head Report"
          actionSlot={
            <TableButton
              name="Add New Object Head"
              onClick={() => {
                setEditingItem(null);
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
          title={editingItem ? "Edit Object Head" : "Add New Object Head"}
          fields={objectHeadFormFields}
          initialValues={editingItem}
          loading={saving}
          error={formError}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingItem(null);
          }}
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

export default Object_Head;
