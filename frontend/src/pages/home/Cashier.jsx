// src/pages/Cashier/Cashier.jsx
import { useEffect, useState, useCallback } from "react";
import DataTable from "../../components/DataTable/DataTable.jsx";
import TableButton from "../../components/ui/TableButton.jsx";
import FormOne from "../../components/Forms/FormOne.jsx";
import {
  createCashier,
  getCashiers,
  updateCashier,
  deleteCashier,
} from "../../api/cashier.api.js";
import { Loader } from "../../components/ui/Loader.jsx";
import { showToast } from "../../utils/toast.js";
import { AiFillEdit } from "react-icons/ai";
import { MdDelete, MdRestore } from "react-icons/md";
import AlertModal from "../../components/ui/AlertModal.jsx";
import { getDDOs } from "../../api/ddo.api.js";
import { getDivisions } from "../../api/division.api.js";

const Cashier = () => {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // per-row loading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingCashier, setEditingCashier] = useState(null);
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
    cashierId: null,
  });
  const [ddoOptions, setDdoOptions] = useState([]);
  const [divisionOptions, setDivisionOptions] = useState([]);

  useEffect(() => {
    fetchCashiers();
    fetchFormMasters();
  }, []);

  const fetchCashiers = async () => {
    try {
      setLoading(true);
      const res = await getCashiers();
      setCashiers(res.data.cashiers);
    } catch (error) {
      console.error("Error fetching cashiers:", error);
      showToast("Failed to load cashiers", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMasters = async () => {
    try {
      const [ddoRes, divisionRes] = await Promise.all([
        getDDOs(),
        getDivisions(),
      ]);

      setDdoOptions(
        ddoRes.data.ddos.map((d) => ({
          label: `${d.ddoCode} - ${d.ddoName}`,
          value: d.id,
        })),
      );

      setDivisionOptions(
        divisionRes.data.divisions.map((d) => ({
          label: `${d.divisionCode} - ${d.divisionName} `,
          value: d.id,
        })),
      );
    } catch (error) {
      showToast("Failed to load form data", "error");
    }
  };

  const handleDeleteOrReactivate = useCallback(async (cashierId, isActive) => {
    setActionLoading((prev) => ({ ...prev, [cashierId]: true }));
    try {
      await deleteCashier(cashierId);

      // Update state immediately
      setCashiers((prev) =>
        prev.map((cashier) =>
          cashier.id === cashierId
            ? { ...cashier, isActive: !isActive }
            : cashier,
        ),
      );

      showToast(
        isActive ? "Cashier deactivated!" : "Cashier reactivated!",
        "success",
      );
      setAlertModal((prev) => ({ ...prev, open: false, onConfirm: null }));
    } catch (error) {
      showToast("Operation failed", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [cashierId]: false }));
    }
  }, []);

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setIsModalOpen(true);
    setFormError("");
  };

  const openAlertModal = (cashierId, isActive) => {
    setAlertModal({
      open: true,
      title: isActive ? "Deactivate Cashier?" : "Reactivate Cashier?",
      message: isActive
        ? "This cashier will be marked as inactive and hidden from active list."
        : "This cashier will be marked as active again.",
      onConfirm: () => handleDeleteOrReactivate(cashierId, isActive),
      cashierId,
      isActive,
    });
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "cashierCode", label: "Code" },
    {
      key: "ddo",
      label: "DDO",
      render: (value, row) => value?.ddoName || row.ddoId || "-",
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

  const cashierFormFields = [
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
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "Enter phone",
    },
    {
      name: "cashierCode",
      label: "Code",
      type: "text",
      placeholder: "Enter code",
      disabled: !!editingCashier,
    },
    {
      name: "ddoId",
      label: "DDO ID",
      type: "select",
      options: ddoOptions,
      placeholder: "Select DDO",
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

    try {
      let res;
      if (editingCashier) {
        res = await updateCashier(editingCashier.id, formData);
        setCashiers((prev) =>
          prev.map((c) => (c.id === editingCashier.id ? res.data.cashier : c)),
        );
        showToast("Cashier updated successfully!", "success");
      } else {
        res = await createCashier(formData);
        const formattedCashier = {
          ...res.data.cashier,
          ddo: res.data.cashier.ddo || {
            ddoName: `DDO-${formData.ddoId}`,
            id: parseInt(formData.ddoId),
          },
        };
        setCashiers((prev) => [...prev, formattedCashier]);
        showToast("Cashier added successfully!", "success");
      }

      setIsModalOpen(false);
      setEditingCashier(null);
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
        <h1 className="font-unbounded text-3xl font-normal">
          Cashier Management
        </h1>

        {loading ? (
          <Loader />
        ) : (
          <DataTable
            data={cashiers}
            columns={columns}
            searchableKeys={["name", "email", "phone", "cashierCode"]}
            statusKey="isActive"
            pageSize={10}
            loading={loading}
            downloadFileName="cashiers"
            printTitle="Cashier Report"
            actionSlot={
              <TableButton
                name="Add New Cashier"
                onClick={() => {
                  setEditingCashier(null);
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
          fields={cashierFormFields}
          initialValues={editingCashier}
          onClose={() => {
            setFormError("");
            setIsModalOpen(false);
            setEditingCashier(null);
          }}
          title={editingCashier ? "Edit Cashier" : "Add New Cashier"}
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
        loading={actionLoading[alertModal.cashierId]}
      />
    </>
  );
};

export default Cashier;
