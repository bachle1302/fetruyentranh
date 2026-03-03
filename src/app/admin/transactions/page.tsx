"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { ReactElement } from 'react';
import Link from "next/link";

interface User {
  id: number;
  email: string;
  name: string;
  exp?: number;
  avatar?: string | null;
  total_point?: number;
}

interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TransactionsResponse {
  status?: string;
  data?: Transaction[];
  meta?: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
  };
}

function AdminTransactionsContent(): ReactElement {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [processingTransactionId, setProcessingTransactionId] = useState<number | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [transactionToApprove, setTransactionToApprove] = useState<Transaction | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
    
    if (!token) {
      // Only redirect to login if no token exists
      router.push("/auth/login");
    } else {
      const roleNum = parseInt(role || "0");
      if (roleNum !== 2) {
        // If user is logged in but not an admin, set error state instead of redirecting
        setError("Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể xem giao dịch.");
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        fetchUsers();
      }
    }
  }, [router]);

  useEffect(() => {
    console.log("Current users state:", users);
    console.log("Filtered users:", filteredUsers);
  }, [users, filteredUsers]);

  const fetchUsers = async () => {
    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập trang này.");
        return;
      }
      
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get("${process.env.NEXT_PUBLIC_BASE_API}/api/user", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("API Response:", response.data);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else if (response.data.users && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        console.error("Cấu trúc dữ liệu không đúng định dạng:", response.data);
        setError("Dữ liệu người dùng không đúng định dạng");
      }
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      
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
    }
  };

  const fetchUserDetails = async (userId: number) => {
    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/api/user/${selectedUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUser(response.data.user);
      console.log("API Response:", response.data);
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
      
      setError("Không thể tải thông tin người dùng");
    }
  };

  const fetchTransactions = async () => {
    if (!selectedUserId) return;

    try {
      // Only fetch if user is admin
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      
      setIsLoading(true);
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }
      
      const response = await axios.get<Transaction[]>(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/transactions/user/${selectedUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // API trả về mảng trực tiếp, không có cấu trúc meta
      const allTransactions = response.data;
      setAllTransactions(allTransactions);
      setTotalTransactions(allTransactions.length);
      
      // Không có phân trang từ API, nên tự xử lý phân trang ở client
      const itemsPerPage = 10;
      const calculatedTotalPages = Math.ceil(allTransactions.length / itemsPerPage);
      setTotalPages(calculatedTotalPages);
      
      // Phân trang sẽ được xử lý trong useEffect khi currentPage thay đổi
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách giao dịch:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      // Nếu lỗi 404, có nghĩa là không có giao dịch, hiển thị danh sách rỗng
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setAllTransactions([]);
        setTransactions([]);
        setTotalTransactions(0);
        setTotalPages(1);
      } else {
        setError("Không thể tải danh sách giao dịch");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      // Check admin permission first
      const role = Cookies.get("role");
      if (parseInt(role || "0") !== 2) {
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      
      fetchTransactions();
      fetchUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (allTransactions.length > 0) {
      const itemsPerPage = 10;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      console.log(`Phân trang: trang ${currentPage}, hiển thị ${startIndex+1}-${Math.min(endIndex, allTransactions.length)} trên ${allTransactions.length} giao dịch`);
      setTransactions(allTransactions.slice(startIndex, endIndex));
    }
  }, [currentPage, allTransactions]);

  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Thêm hàm xử lý duyệt giao dịch
  const approveTransaction = async (transactionId: number) => {
    try {
      setProcessingTransactionId(transactionId);
      const token = Cookies.get("token");
      if (!token) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/transactions/approve/${transactionId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setSuccess(`Giao dịch #${transactionId} đã được duyệt thành công. ${response.data.message}`);
        // Refresh danh sách giao dịch sau khi duyệt
        fetchTransactions();
        // Refresh thông tin người dùng để cập nhật số dư
        fetchUserDetails(selectedUserId!);
      }
    } catch (error: any) {
      console.error("Lỗi khi duyệt giao dịch:", error);
      
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        Cookies.remove("token");
        Cookies.remove("role");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        return;
      }
      
      setError(`Không thể duyệt giao dịch. ${error.response?.data?.error || error.message}`);
    } finally {
      setProcessingTransactionId(null);
      setShowApproveModal(false);
      setTransactionToApprove(null);
    }
  };

  const openApproveModal = (transaction: Transaction) => {
    setTransactionToApprove(transaction);
    setShowApproveModal(true);
  };

  // Hàm hiển thị nút duyệt nếu giao dịch đang ở trạng thái "pending"
  const renderApproveButton = (transaction: Transaction) => {
    if (transaction.status === 'pending') {
      return (
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => openApproveModal(transaction)}
          disabled={processingTransactionId === transaction.id}
        >
          {processingTransactionId === transaction.id ? 'Đang xử lý...' : 'Duyệt'}
        </button>
      );
    }
    return null;
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Nạp tiền';
      case 'withdraw': return 'Rút tiền';
      case 'purchase': return 'Mua hàng';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'completed': return 'Hoàn thành';
      case 'failed': return 'Thất bại';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'failed':
        return 'text-danger';
      default:
        return 'text-secondary';
    }
  };

  if (!isAdmin) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="text-center p-5 bg-light rounded shadow" style={{ maxWidth: '600px' }}>
          <h2 className="text-danger mb-4">🔒 Quyền truy cập bị từ chối</h2>
          <p className="lead mb-4">{error || "Bạn không có quyền truy cập trang này. Chỉ quản trị viên mới có thể xem giao dịch."}</p>
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
            <Link className="nav-link text-white" href="/admin/users">👤 Quản lý Người dùng</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white active" href="/admin/transactions">💰 Quản lý Giao dịch</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link text-white" href="/upload">✍️ Upload ảnh</Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 p-4">
        <h2 className="mb-4 text-white">💰 Quản lý Giao dịch</h2>
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
          </div>
        )}

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm email hoặc tên người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={fetchUsers}
              >
                🔄 Làm mới
              </button>
            </div>
            <div className="mb-2 text white">
              <small className="text-white">Đã tải: {users.length} người dùng</small>
            </div>
            <select
              className="form-select"
              value={selectedUserId || ""}
              onChange={(e) => {
                setError(null);
                setSelectedUserId(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="">Chọn người dùng</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.email} - {user.name}
                </option>
              ))}
            </select>   
          </div>
        </div>

        {selectedUser && (
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Thông tin người dùng</h5>
              <div className="row">
                <div className="col-md-6">
                  <p><strong>ID:</strong> {selectedUser.id}</p>
                  <p><strong>Tên:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Số dư tài khoản:</strong> 
                    <span className="ms-2 fs-5 badge bg-success">
                      {Number(selectedUser.total_point || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3">Đang tải dữ liệu giao dịch...</p>
          </div>
        ) : selectedUserId ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="text-white">Danh sách giao dịch</h4>
              <span className="badge bg-secondary">Tổng số: {totalTransactions}</span>
            </div>
            
            {transactions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Số tiền</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                      <th>Mô tả</th>
                      <th>Thời gian</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{transaction.id}</td>
                        <td>
                          <span className={transaction.type === 'withdraw' ? 'text-danger' : 'text-success'}>
                            {transaction.type === 'withdraw' ? '-' : '+'}{transaction.amount.toLocaleString('vi-VN')}đ
                          </span>
                        </td>
                        <td>{getTransactionTypeLabel(transaction.type)}</td>
                        <td>
                          <span className={`badge ${
                            transaction.status === 'completed' ? 'bg-success' : 
                            transaction.status === 'pending' ? 'bg-warning' : 
                            'bg-danger'
                          }`}>
                            {getStatusLabel(transaction.status)}
                          </span>
                        </td>
                        <td>{transaction.description || 'Không có mô tả'}</td>
                        <td>{new Date(transaction.created_at).toLocaleString('vi-VN')}</td>
                        <td>
                          {renderApproveButton(transaction)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">Người dùng này chưa có giao dịch nào</div>
            )}
            
            {totalPages > 1 && (
              <nav className="mt-4">
                <ul className="pagination justify-content-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </>
        ) : (
          <div className="text-center p-5 bg-light rounded">
            <div className="mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-wallet2" viewBox="0 0 16 16">
                <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
              </svg>
            </div>
            <h4>Vui lòng chọn một người dùng để xem giao dịch</h4>
            <p className="text-muted">Sử dụng ô tìm kiếm và chọn người dùng từ danh sách</p>
          </div>
        )}

        {/* Modal xác nhận duyệt giao dịch */}
        {showApproveModal && transactionToApprove && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận duyệt giao dịch</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowApproveModal(false);
                      setTransactionToApprove(null);
                    }}
                    disabled={processingTransactionId !== null}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <h6>Thông tin giao dịch:</h6>
                    <p><strong>ID giao dịch:</strong> {transactionToApprove.id}</p>
                    <p><strong>Loại giao dịch:</strong> {getTransactionTypeLabel(transactionToApprove.type)}</p>
                    <p><strong>Số tiền:</strong> {transactionToApprove.amount.toLocaleString('vi-VN')}đ</p>
                    {transactionToApprove.description && (
                      <p><strong>Mô tả:</strong> {transactionToApprove.description}</p>
                    )}
                    <p className="mb-0">
                      <strong>Người dùng:</strong> {selectedUser?.name} (ID: {selectedUser?.id})
                    </p>
                  </div>
                  
                  <p>
                    {transactionToApprove.type === 'deposit'
                      ? `Bạn có chắc chắn muốn duyệt giao dịch nạp tiền này? Số dư của người dùng sẽ tăng thêm ${transactionToApprove.amount.toLocaleString('vi-VN')}đ.`
                      : `Bạn có chắc chắn muốn duyệt giao dịch rút tiền này? Số dư của người dùng sẽ giảm ${transactionToApprove.amount.toLocaleString('vi-VN')}đ.`
                    }
                  </p>
                  <p className="text-danger fw-bold">Lưu ý: Hành động này không thể hoàn tác!</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowApproveModal(false);
                      setTransactionToApprove(null);
                    }}
                    disabled={processingTransactionId !== null}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => approveTransaction(transactionToApprove.id)}
                    disabled={processingTransactionId !== null}
                  >
                    {processingTransactionId === transactionToApprove.id 
                      ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...</>
                      : 'Xác nhận duyệt'
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminTransactionsContent; 