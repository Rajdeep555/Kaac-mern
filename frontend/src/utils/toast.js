export const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-all duration-300 ${type === "success" ? "bg-green-500" : "bg-red-500"
        }`;

    document.body.appendChild(toast);

    // Animates in
    setTimeout(() => toast.classList.remove("translate-x-full"), 100);

    // Removes after 3s
    setTimeout(() => {
        toast.classList.add("translate-x-full");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
