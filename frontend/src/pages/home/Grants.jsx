import { useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import { useGrants } from "../../hooks/useGrants.js";
import {
  createGrant,
  updateGrant,
  toggleGrant,
  getGrants,
} from "../../api/grant.api.js";

const Grants = () => {
  const { grants, setGrants, loading, error } = useGrants();

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
      title: isActive ? "Deactivate Grant?" : "Reactivate Grant?",
      message: isActive
        ? "This grant will be marked as inactive."
        : "This grant will be marked as active again.",
      onConfirm: () => handleToggleStatus(itemId, isActive),
      itemId,
      isActive,
    });
  };

  const handleToggleStatus = useCallback(
    async (itemId, isActive) => {
      setActionLoading((prev) => ({ ...prev, [itemId]: true }));
      try {
        await toggleGrant(itemId);
        setGrants((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, isActive: !isActive } : item,
          ),
        );
        showToast(
          isActive ? "Grant deactivated!" : "Grant reactivated!",
          "success",
        );
        setAlertModal((prev) => ({ ...prev, open: false }));
      } catch {
        showToast("Operation failed", "error");
      } finally {
        setActionLoading((prev) => ({ ...prev, [itemId]: false }));
      }
    },
    [setGrants],
  );

  const refetchGrants = async () => {
    const refreshed = await getGrants();
    const list = Array.isArray(refreshed.data.grants)
      ? refreshed.data.grants
      : [];
    setGrants(list);
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingItem) {
        const res = await updateGrant(editingItem.id, formData);
        const updated = res.data.grant ?? res.data.data?.grant ?? null;

        if (updated?.id) {
          setGrants((prev) =>
            prev.map((item) => (item.id === editingItem.id ? updated : item)),
          );
        } else {
          await refetchGrants();
        }
        showToast("Grant updated successfully!", "success");
      } else {
        const res = await createGrant(formData);
        const created = res.data.grant ?? res.data.data?.grant ?? null;

        if (created?.id) {
          setGrants((prev) => [created, ...prev]);
        } else {
          await refetchGrants();
        }
        showToast("Grant added successfully!", "success");
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      const msg =
        error?.response?.data?.message || error.message || "Operation failed";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "code", label: "Code" },
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

  const grantFormFields = [
    {
      name: "code",
      label: "Code",
      type: "text",
      placeholder: "Enter grant code",
      required: true,
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter grant name",
      required: true,
    },
    {
      name: "sector",
      label: "Sector",
      type: "select",
      placeholder: "Select sector",
      options: [
        { label: "State", value: "STATE" },
        { label: "Council", value: "COUNCIL" },
      ],
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          Grant Management
        </h1>

        {error && (
          <p className="text-red-600 text-sm">Failed to load grants.</p>
        )}

        <DataTable
          data={grants}
          columns={columns}
          loading={loading}
          searchableKeys={["code", "name", "sector"]}
          statusKey="isActive"
          pageSize={10}
          downloadFileName="grants"
          printTitle="Grants Report"
          actionSlot={
            <TableButton
              name="Add New Grant"
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
          title={editingItem ? "Edit Grant" : "Add New Grant"}
          fields={grantFormFields}
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

export default Grants;
