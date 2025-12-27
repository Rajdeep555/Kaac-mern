import DataTable from "../../components/DataTable/DataTable.jsx";

const Cashier = () => {
  const cashiers = [
    {
      id: 1,
      name: "Rajdeep",
      email: "rajdeep@mail.com",
      phone: "9876543210",
      status: "active",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
    {
      id: 2,
      name: "Aman",
      email: "aman@mail.com",
      phone: "9123456789",
      status: "inactive",
    },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Heading */}
      <h1 className="font-unbounded text-3xl font-normal">
        Cashier Management
      </h1>

      {/* Reusable Table */}
      <DataTable
        data={cashiers}
        columns={columns}
        searchableKeys={["name", "email", "phone"]}
        statusKey="status"
        pageSize={5}
      />
    </div>
  );
};

export default Cashier;
