import { redirect } from "next/navigation";

export default function GlobalLoginPage() {
  // Phương án 1: Mặc định đẩy về trang login của Học viên
  redirect("/student/login");
}
