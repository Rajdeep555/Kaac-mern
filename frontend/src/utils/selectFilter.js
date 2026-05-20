export const commonSelectFilter = (option, inputValue) => {
    const search = inputValue.toLowerCase();

    return (
        option.label?.toLowerCase().includes(search) ||
        option.value?.toString().toLowerCase().includes(search)
    );
};