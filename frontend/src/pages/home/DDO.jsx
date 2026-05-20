import { useEffect, useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import { Loader } from "../../components/ui/Loader.jsx";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { createDDO, deleteDDO, getDDOs, updateDDO } from "../../api/ddo.api.js";
import { getDivisions } from "../../api/division.api.js";

const DDO = () => {
  const [ddos, setDDOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingDDO, setEditingDDO] = useState(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    ddoId: null,
    isActive: null,
  });
  const [divisionOptions, setDivisionOptions] = useState([]);

  useEffect(() => {
    fetchDDOs();
    fetchFormMasters();
  }, []);

  const fetchDDOs = async () => {
    try {
      setLoading(true);
      const res = await getDDOs();
      setDDOs(res.data.ddos);
    } catch (error) {
      console.error("Error fetching ddos:", error);
      showToast("Failed to load DDOs", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMasters = async () => {
    try {
      const [divisionRes] = await Promise.all([getDivisions()]);
      setDivisionOptions(
        divisionRes.data.divisions.map((d) => ({
          label: `${d.divisionCode} - ${d.divisionName}`,
          value: d.id,
        })),
      );
    } catch (error) {
      console.error("Error fetching form masters:", error);
      showToast("Failed to load form data", "error");
    }
  };

  const handleDeleteOrReactivate = useCallback(async (ddoId, isActive) => {
    setActionLoading((prev) => ({ ...prev, [ddoId]: true }));
    try {
      await deleteDDO(ddoId);

      // ✅ Toggle isActive in local state immediately
      setDDOs((prev) =>
        prev.map((ddo) =>
          ddo.id === ddoId ? { ...ddo, isActive: !isActive } : ddo,
        ),
      );

      showToast(isActive ? "DDO deactivated!" : "DDO reactivated!", "success");
      setAlertModal((prev) => ({ ...prev, open: false, onConfirm: null }));
    } catch (error) {
      console.error("Delete/reactivate error:", error);
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [ddoId]: false }));
    }
  }, []);

  const handleEdit = (ddo) => {
    setEditingDDO(ddo);
    setFormError("");
    setIsModalOpen(true);
  };

  const openAlertModal = (ddoId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate DDO?" : "Reactivate DDO?",
      message: isActive
        ? "This DDO will be marked as inactive and hidden from the active list."
        : "This DDO will be marked as active again.",
      onConfirm: () => handleDeleteOrReactivate(ddoId, isActive),
      ddoId,
      isActive,
    });
  };

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");

    // ✅ FIX: Guard divisionId — Number(undefined) = NaN which fails Zod validation
    const payload = {
      ...formData,
      ...(formData.divisionId
        ? { divisionId: Number(formData.divisionId) }
        : {}),
    };

    try {
      let res;
      if (editingDDO) {
        res = await updateDDO(editingDDO.id, payload);
        // ✅ FIX: res.data.ddo (singular), not res.data.ddos
        setDDOs((prev) =>
          prev.map((ddo) => (ddo.id === editingDDO.id ? res.data.ddo : ddo)),
        );
        showToast("DDO updated successfully!", "success");
      } else {
        res = await createDDO(payload);
        // ✅ FIX: res.data.ddo (singular), consistent with backend response
        setDDOs((prev) => [...prev, res.data.ddo]);
        showToast("DDO added successfully!", "success");
      }

      setIsModalOpen(false);
      setEditingDDO(null);
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
    { key: "ddoName", label: "Name" },
    { key: "ddoCode", label: "Code" },
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

  // ✅ Moved inside component body so editingDDO state is always current
  const ddoFormFields = [
    {
      name: "ddoName",
      label: "Name",
      type: "text",
      placeholder: "Enter name",
      required: true,
    },
    {
      name: "ddoEmail",
      label: "Email",
      type: "email",
      placeholder: "Enter email",
    },
    {
      name: "ddoPhone",
      label: "Phone",
      type: "text",
      placeholder: "Enter phone",
    },
    {
      name: "ddoCode",
      label: "Code",
      type: "text",
      placeholder: "Enter code",
      required: !editingDDO,
      disabled: !!editingDDO,
    },
    {
      name: "divisionId",
      label: "Division",
      type: "select",
      options: divisionOptions,
      placeholder: "Select Division",
    },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">DDO Management</h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            data={ddos}
            columns={columns}
            // ✅ FIX: searchableKeys use actual field names that exist in data
            searchableKeys={["ddoName", "ddoCode"]}
            statusKey="isActive"
            pageSize={50}
            loading={loading}
            downloadFileName="ddo"
            printTitle="DDO Report"
            actionSlot={
              <TableButton
                name="Add New DDO"
                onClick={() => {
                  setEditingDDO(null);
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
          fields={ddoFormFields}
          initialValues={editingDDO}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingDDO(null);
          }}
          title={editingDDO ? "Edit DDO" : "Add New DDO"}
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
        loading={actionLoading[alertModal.ddoId]}
      />
    </>
  );
};

export default DDO;
