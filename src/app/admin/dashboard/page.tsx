"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  exp: number;
  avatar: string | null;
  total_point: number;
  role_id: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalStories, setTotalStories] = useState(0);
  const [totalChapters, setTotalChapters] = useState(4);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
    const id = Cookies.get("user_id");
  
    console.log("Token:", token);
    console.log("Role:", role);
    console.log("User ID:", id);
  
    if (!token) {
      console.log("Không tìm thấy token");
      router.replace("/auth/login");
    } else {
      const roleNum = parseInt(role || "0");
      if (roleNum !== 1 && roleNum !== 2) {
        console.log("Không có quyền admin");
        router.replace("/auth/login");
      } else {
        setIsAdmin(true);
        if (id) {
          setUserId(id);
          fetchUserInfo(id);
        } else {
          console.log("Không tìm thấy user_id trong cookies");
          // Sử dụng dữ liệu mẫu khi không có id
          const mockUser = {
            id: 153,
            name: "bachlevip",
            email: "user2@gmail.com",
            exp: 0,
            avatar: null,
            total_point: 237.28,
            role_id: 1
          };
          setUserInfo(mockUser);
          setLoading(false);
        }
      }
    }
  }, []);
  
  const fetchUserInfo = async (id: string) => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      
      if (!token) {
        throw new Error("Token không tồn tại");
      }
      
      console.log("Bắt đầu gọi API lấy thông tin người dùng với ID:", id);
      
      // Trực tiếp gọi API với ID cứng để thử
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/user/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("API Response:", response.data);
      
      if (response.data && response.data.user) {
        console.log("Thông tin người dùng API trả về:", response.data.user);
        setUserInfo(response.data.user);
      } else {
        console.error("API không trả về dữ liệu user trong response");
        setError("Không thể lấy thông tin người dùng từ API");
        
        // Sử dụng dữ liệu mẫu nếu API không trả về đúng định dạng
        const mockUser = {
          id: 153,
          name: "bachlevip",
          email: "user2@gmail.com",
          exp: 0,
          avatar: null,
          total_point: 237.28,
          role_id: 1
        };
        setUserInfo(mockUser);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin người dùng:", err);
      console.error("Chi tiết lỗi:", err.response ? err.response.data : "Không có dữ liệu response");
      setError(`Lỗi khi tải thông tin người dùng: ${err.message}`);
      
      // Sử dụng dữ liệu mẫu trong trường hợp lỗi
      const mockUser = {
        id: 153,
        name: "bachlevip",
        email: "user2@gmail.com",
        exp: 0,
        avatar: null,
        total_point: 237.28,
        role_id: 1
      };
      setUserInfo(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1:
        return "Super Admin";
      case 2:
        return "Admin";
      case 3:
        return "Người dùng";
      default:
        return "Không xác định";
    }
  };

  // Thêm hàm fetchUserData để debug
  const fetchDebugData = () => {
    if (!userInfo) {
      // Nếu userInfo vẫn là null, sử dụng dữ liệu mẫu
      const mockUser = {
        id: 153,
        name: "bachlevip",
        email: "user2@gmail.com",
        exp: 0,
        avatar: null,
        total_point: 237.28,
        role_id: 1
      };
      setUserInfo(mockUser);
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="text-center mt-5">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="d-flex" style={{ backgroundColor: "#212529", minHeight: "100vh", color: "white" }}>
      {/* Sidebar */}
      <div className="bg-dark text-white vh-100 p-3" style={{ width: "250px" }}>
        <h4 className="text-center mb-4">Admin Panel</h4>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/admin/dashboard">
              <span className="me-2">🏠</span> Dashboard
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/admin/stories">
              <span className="me-2">📚</span> Quản lý Truyện
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/admin/chapters">
              <span className="me-2">📄</span> Quản lý Chương
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/admin/comments">
              <span className="me-2">💬</span> Quản lý Bình luận
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/admin/users">
              <span className="me-2">👤</span> Quản lý Người dùng
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/admin/transactions">
              <span className="me-2">💰</span> Quản lý Giao dịch
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link text-white d-flex align-items-center" href="/upload">
              <span className="me-2">✍️</span> Upload ảnh
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h2 className="mb-4">Chào mừng đến với Admin Dashboard</h2>
        
        {error && (
          <div className="alert alert-danger">
            {error}
            <div className="mt-2">
              <button className="btn btn-sm btn-primary" onClick={fetchDebugData}>
                Dùng dữ liệu mẫu
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2">Đang tải thông tin tài khoản...</p>
            <button className="btn btn-sm btn-outline-light mt-3" onClick={fetchDebugData}>
              Dùng dữ liệu mẫu
            </button>
          </div>
        ) : userInfo ? (
          <>
            {/* User Info Card */}
            <div className="mb-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  {userInfo.avatar ? (
                    <img 
                      src={userInfo.avatar.startsWith('http') ? userInfo.avatar : `${process.env.NEXT_PUBLIC_BASE_API}${userInfo.avatar}`}
                      alt="Avatar"
                      className="rounded-circle"
                      width={60}
                      height={60}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                      style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}
                    >
                      {userInfo.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="mb-0">{userInfo.name}</h4>
                  <div className="text-muted">{userInfo.email}</div>
                  <span className="badge bg-primary mt-1">{getRoleName(userInfo.role_id)}</span>
                </div>
              </div>
              
              {/* Balance Card */}
              <div className="mt-3 mb-4">
                <div className="d-flex align-items-center">
                  <div style={{ backgroundColor: "#212529", padding: "10px", borderRadius: "8px" }}>
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle bg-warning d-flex align-items-center justify-content-center text-dark me-3"
                        style={{ width: '30px', height: '30px', fontSize: '1rem' }}
                      >
                        <span>₫</span>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.9rem", color: "#adb5bd" }}>Số dư</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{userInfo ? userInfo.total_point.toLocaleString('vi-VN') : 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="row">
              <div className="col-md-6 mb-4">
                <div style={{ backgroundColor: "#0d6efd", padding: "20px", borderRadius: "8px" }}>
                  <h5 className="mb-3">Tổng số truyện đã đăng</h5>
                  <h2 className="mb-0">{totalStories}</h2>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div style={{ backgroundColor: "#198754", padding: "20px", borderRadius: "8px" }}>
                  <h5 className="mb-3">Tổng số chương đã đăng</h5>
                  <h2 className="mb-0">{totalChapters}</h2>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="alert alert-warning">
            Không tìm thấy thông tin người dùng
          </div>
        )}
      </div>
    </div>
  );
}
