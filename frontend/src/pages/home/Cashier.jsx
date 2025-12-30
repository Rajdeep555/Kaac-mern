// src/pages/Cashier/Cashier.jsx
import { useEffect, useState } from "react";
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
import { MdDelete } from "react-icons/md";

const Cashier = () => {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingCashier, setEditingCashier] = useState(null); // For update

  useEffect(() => {
    fetchCashiers();
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

  const handleDelete = async (cashierId) => {
    if (!confirm("Are you sure you want to delete this cashier?")) return;

    try {
      await deleteCashier(cashierId);
      setCashiers((prev) => prev.filter((c) => c.id !== cashierId));
      showToast("Cashier deleted successfully!", "success");
    } catch (error) {
      showToast("Failed to delete cashier", "error");
    }
  };

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setIsModalOpen(true);
    setFormError("");
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
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="px-2.5 cursor-pointer py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            title="Edit">
            <AiFillEdit />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-2.5 cursor-pointer py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            title="Delete">
            <MdDelete />
          </button>
        </div>
      ),
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
      required: true,
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "Enter phone",
      required: true,
    },
    {
      name: "cashierCode",
      label: "Code",
      type: "text",
      placeholder: "Enter code",
      required: true,
    },
    {
      name: "ddoId",
      label: "DDO ID",
      type: "text",
      placeholder: "Enter DDO ID",
      required: true,
    },
    {
      name: "divisionId",
      label: "Division ID",
      type: "text",
      placeholder: "Enter Division ID",
      required: true,
    },
  ];

  const handleSubmit = async (formData) => {
    setSaving(true);
    setFormError("");

    try {
      let res;
      if (editingCashier) {
        // UPDATE
        res = await updateCashier(editingCashier.id, formData);
        setCashiers((prev) =>
          prev.map((c) => (c.id === editingCashier.id ? res.data.cashier : c))
        );
        showToast("Cashier updated successfully!", "success");
      } else {
        // CREATE
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
      </div>

      {isModalOpen && (
        <FormOne
          isOpen={isModalOpen}
          fields={cashierFormFields}
          initialValues={editingCashier} // Pre-fill for edit
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
    </>
  );
};

export default Cashier;
