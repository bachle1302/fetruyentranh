"use client";

import { useEffect, useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import Link from "next/link";
import { Modal, Button, Form } from "react-bootstrap";

interface User {
  id: number;
  name: string;
  email: string;
  exp: number;
  avatar: string | null;
  total_point: number;
  email_verified_at?: string | null;
  role_id?: number;
  status?: number;
  google_id?: string | null;
  remember_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  users: User[];
}

interface UserDetailResponse {
  message: string;
  user: User;
}

function AdminUsers(): ReactElement {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("token");
      const role = Cookies.get("role");
      
      if (!token) {
        // Only redirect to login if no token exists
        router.push("/auth/login");
      } else {
        const roleNum = parseInt(role || "0");
        if (roleNum !== 2) {
          // If user is logged in but not an admin, set error state instead of redirecting
          setError("Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể quản lý người dùng.");
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
          fetchUsers();
        }
      }
    };
    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập trang này.");
        setIsAdmin(false);
        return;
      }
      
      setIsLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get<ApiResponse>(`${process.env.NEXT_PUBLIC_BASE_API}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetail = async (userId: number) => {
    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        setIsAdmin(false);
        return;
      }
      
      setIsDetailLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get<UserDetailResponse>(`${process.env.NEXT_PUBLIC_BASE_API}/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data && response.data.user) {
        console.log("User data:", response.data.user);
        
        // Ensure role_id is a number
        const userData = response.data.user;
        if (userData.role_id === undefined || userData.role_id === null) {
          userData.role_id = 0; // Default to regular user if not specified
        } else if (typeof userData.role_id === 'string') {
          userData.role_id = parseInt(userData.role_id);
        }
        
        console.log("Processed user data:", userData);
        setSelectedUser(userData);
      } else {
        setError("Không thể tải thông tin chi tiết người dùng");
      }
    } catch (error: any) {
      console.error("Lỗi khi tải thông tin người dùng:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError("Không thể tải thông tin chi tiết người dùng");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleView = async (user: User) => {
    // Only allow view if user is admin
    const role = Cookies.get("role");
    if (parseInt(role || "0") !== 2) {
      setError("Bạn không có quyền xem thông tin chi tiết người dùng.");
      return;
    }
    
    setSelectedUser(user); // Đặt thông tin cơ bản trước
    setIsEdit(false);
    setShowModal(true);
    await fetchUserDetail(user.id); // Sau đó tải thông tin chi tiết
  };

  const handleEdit = async (user: User) => {
    // Only allow edit if user is admin
    const role = Cookies.get("role");
    if (parseInt(role || "0") !== 2) {
      setError("Bạn không có quyền chỉnh sửa người dùng.");
      return;
    }
    
    setSelectedUser(user);
    setIsEdit(true);
    setShowModal(true);
    await fetchUserDetail(user.id); // Tải thông tin chi tiết trước khi chỉnh sửa
  };

  const handleDelete = async (id: number) => {
    try {
      if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
        return;
      }
      
      // Only delete if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền xóa người dùng.");
        return;
      }
      
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_API}/api/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSuccess("Xóa người dùng thành công!");
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError("Không thể xóa người dùng");
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    try {
      setIsSaving(true);
      
      // Only save if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền chỉnh sửa người dùng.");
        return;
      }
      
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      // Ensure role_id is a number before sending
      const userData = { ...selectedUser };
      if (userData.role_id === undefined || userData.role_id === null) {
        userData.role_id = 0;
      } else if (typeof userData.role_id === 'string') {
        userData.role_id = parseInt(userData.role_id);
      }
      
      console.log("Saving user data:", userData);
      
      // Use the correct API endpoint with user ID
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_API}/api/user/${userData.id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setShowModal(false);
      setSuccess("Cập nhật người dùng thành công!");
      fetchUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError("Không thể cập nhật người dùng");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  // Format datetime string to readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render role name
  const renderRole = (roleId?: number) => {
    console.log("Rendering role for:", roleId, "Type:", typeof roleId);
    
    // Nếu role_id là string, chuyển đổi thành number
    if (typeof roleId === 'string') {
      roleId = parseInt(roleId);
    }
    
    switch(roleId) {
      case 0: return <span className="badge bg-secondary">Người dùng</span>;
      case 1: return <span className="badge bg-primary">Tác giả</span>;
      case 2: return <span className="badge bg-danger">Admin</span>;
      default: return <span className="badge bg-warning">Không xác định ({roleId})</span>;
    }
  };

  // Render status
  const renderStatus = (status?: number) => {
    switch(status) {
      case 0: return "Không hoạt động";
      case 1: return "Hoạt động";
      default: return "Không xác định";
    }
  };

  if (!isAdmin) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="text-center p-5 bg-light rounded shadow" style={{ maxWidth: '600px' }}>
          <h2 className="text-danger mb-4">🔒 Quyền truy cập bị từ chối</h2>
          <p className="lead mb-4">{error || "Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể quản lý người dùng."}</p>
          <div className="d-flex justify-content-center gap-3">
            <button 
              className="btn btn-primary" 
              onClick={() => router.push("/admin/dashboard")}
            >
              Về trang chủ
            </button>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => {
                Cookies.remove("token");
                Cookies.remove("role");
                router.push("/auth/login");
              }}
            >
              Đăng nhập với tài khoản khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white vh-100 p-3" style={{ width: "250px" }}>
        <h4 className="text-center">Admin Panel</h4>
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/stories">📚 Quản lý Truyện</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/chapters">📄 Quản lý Chương</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/comments">💬 Quản lý Bình luận</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white active" href="/admin/users">👤 Quản lý Người dùng</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/admin/transactions">💰 Quản lý Giao dịch</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/upload">✍️ Upload ảnh</Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h2 className="mb-4 text-white">👤 Quản lý Người dùng</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
          </div>
        ) : (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>EXP</th>
                <th>Avatar</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.exp}</td>
                  <td>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} width="40" height="40" className="rounded-circle" />
                    ) : (
                      "Không có ảnh"
                    )}
                  </td>
                  <td>
                    <button className="btn btn-info btn-sm me-2" onClick={() => handleView(user)}>Xem</button>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(user)}>Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selectedUser && (
          <Modal show={showModal} onHide={handleCloseModal} backdrop="static" size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{isEdit ? "Sửa Người Dùng" : "Thông Tin Chi Tiết Người Dùng"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {isDetailLoading ? (
                <div className="text-center my-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                  <p className="mt-2">Đang tải thông tin chi tiết...</p>
                </div>
              ) : isEdit ? (
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedUser.name}
                      onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={selectedUser.email} disabled />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>EXP</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedUser.exp}
                      onChange={(e) => setSelectedUser({ ...selectedUser, exp: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Số dư tài khoản</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedUser.total_point}
                      onChange={(e) => setSelectedUser({ ...selectedUser, total_point: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Vai trò</Form.Label>
                    <Form.Select 
                      value={selectedUser.role_id?.toString()} 
                      onChange={(e) => setSelectedUser({ ...selectedUser, role_id: parseInt(e.target.value) })}
                    >
                      <option value="0">Người dùng</option>
                      <option value="1">Tác giả</option>
                      <option value="2">Admin</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select 
                      value={selectedUser.status?.toString()} 
                      onChange={(e) => setSelectedUser({ ...selectedUser, status: parseInt(e.target.value) })}
                    >
                      <option value="0">Không hoạt động</option>
                      <option value="1">Hoạt động</option>
                    </Form.Select>
                  </Form.Group>
                </Form>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2 mb-3">Thông tin cơ bản</h5>
                    <p><strong>ID:</strong> {selectedUser.id}</p>
                    <p><strong>Tên:</strong> {selectedUser.name}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Vai trò:</strong> {renderRole(selectedUser.role_id)}</p>
                    <p><strong>Trạng thái:</strong> {renderStatus(selectedUser.status)}</p>
                    <p><strong>EXP:</strong> {selectedUser.exp}</p>
                    <p><strong>Số dư tài khoản:</strong> {selectedUser.total_point}</p>
                  </div>
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2 mb-3">Thông tin bổ sung</h5>
                    <p><strong>Xác thực email:</strong> {selectedUser.email_verified_at ? "Đã xác thực" : "Chưa xác thực"}</p>
                    <p><strong>Google ID:</strong> {selectedUser.google_id || "Không có"}</p>
                    <p><strong>Remember Token:</strong> {selectedUser.remember_token ? "Có" : "Không"}</p>
                    <p><strong>Ngày tạo:</strong> {formatDate(selectedUser.created_at)}</p>
                    <p><strong>Cập nhật gần nhất:</strong> {formatDate(selectedUser.updated_at)}</p>
                    {selectedUser.avatar && (
                      <div className="mt-3">
                        <p><strong>Avatar:</strong></p>
                        <img 
                          src={selectedUser.avatar} 
                          alt={selectedUser.name}
                          className="img-thumbnail" 
                          style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              {isEdit && (
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu'}
                </Button>
              )}
              <Button variant="secondary" onClick={handleCloseModal}>Đóng</Button>
            </Modal.Footer>
          </Modal>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;