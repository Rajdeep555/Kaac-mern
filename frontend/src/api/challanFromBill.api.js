import { http } from "./apiClient";

export const getChallanFromBillByCashier = () => {
    return http.get("/challanFromBill");
}