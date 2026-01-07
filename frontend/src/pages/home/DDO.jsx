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
  const [actionLoading, setActionLoading] = useState({}); // per-row loading
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
      showToast("Failed to load ddos", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMasters = async () => {
    try {
      const [divisionRes] = await Promise.all([getDivisions()]);

      setDivisionOptions(
        divisionRes.data.divisions.map((d) => ({
          label: `${d.divisionCode} - ${d.divisionName} `,
          value: d.id,
        }))
      );
    } catch (error) {
      showToast("Failed to load form data", "error");
    }
  };

  const handleDeleteOrReactivate = useCallback(async (ddoId, isActive) => {
    setActionLoading((prev) => ({ ...prev, [ddoId]: true }));
    try {
      await deleteDDO(ddoId);

      // Update state immediately
      setDDOs((prev) =>
        prev.map((ddos) =>
          ddos.id === ddoId ? { ...ddos, isActive: !isActive } : ddos
        )
      );

      showToast(isActive ? "DDO deactivated!" : "DDO reactivated!", "success");
      setAlertModal((prev) => ({ ...prev, open: false, onConfirm: null }));
    } catch (error) {
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [ddoId]: false }));
    }
  }, []);

  const handleEdit = (ddo) => {
    setEditingDDO(ddo);
    setIsModalOpen(true);
    setFormError("");
  };

  const openAlertModal = (ddoId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate DDO?" : "Reactivate DDO?",
      message: isActive
        ? "This DDO will be marked as inactive and hidden from active list."
        : "This DDO will be marked as active again.",
      onConfirm: () => handleDeleteOrReactivate(ddoId, isActive),
      ddoId,
      isActive,
    });
  };

  const columns = [
    { key: "ddoName", label: "Name" },
    { key: "ddoEmail", label: "Email" },
    { key: "ddoPhone", label: "Phone" },
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
              title={isActive ? "Delete" : "Reactivate"}>
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
      disabled: !!editingDDO,
    },
    {
      name: "divisionId",
      label: "Division ID",
      type: "select",
      options: divisionOptions,
      placeholder: "Select Division",
    },
  ];

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");
    console.log("FORM DATA - ", formData);
    const payload = {
      ...formData,
      divisionId: Number(formData.divisionId),
    };
    try {
      let res;
      if (editingDDO) {
        res = await updateDDO(editingDDO.id, payload);
        setDDOs((prev) =>
          prev.map((ddo) => (ddo.id === editingDDO.id ? res.data.ddos : ddo))
        );
        showToast("DDO updated successfully!", "success");
      } else {
        res = await createDDO(payload);
        const formattedDDO = {
          ...res.data.ddo,
        };
        setDDOs((prev) => [...prev, formattedDDO]);
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
            searchableKeys={["name", "email", "phone", "ddoCode"]}
            statusKey="isActive"
            pageSize={10}
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
        onClose={() => setAlertModal({ ...alertModal, open: false })}
        onConfirm={alertModal.onConfirm}
        title={alertModal.title}
        message={alertModal.message}
        confirmText={alertModal.isActive ? "Delete" : "Reactivate"}
        loading={actionLoading[alertModal.ddoId]}
      />
    </>
  );
};

export default DDO;
