"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { ReactElement } from 'react';
import ImageSelector from '@/components/ImageSelector';
import { Button } from "react-bootstrap";

interface Story {
  id: number;
  name: string;
  slug: string;
  thumbnail: string;
  content: string;
  status: number;
  is_public: boolean;
  authorIds: number[];
  translatorIds: number[];
  categoryIds: number[];
  user_id?: number;
  description?: string;
  cover_image?: string;
  view_total?: number;
  updated_at?: string;
}

interface StoriesResponse {
  comicsRecent: Story[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface NewStory {
  name: string;
  slug: string;
  thumbnail: string;
  content: string;
  status: number;
  is_public: boolean;
  authorIds: number[];
  translatorIds: number[];
  categoryIds: number[];
}

interface ChaptersResponse {
  chapters: any[];
  data?: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface ChapterDetail {
  comics: {
    id: number;
    name: string;
    slug: string;
    content: string;
    thumbnail: string;
    status: number;
    is_public: number;
    is_recommend: number;
    origin_name: string | null;
    view_total: number;
    view_day: number;
    view_week: number;
    view_month: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    upview_at: string | null;
  };
  currentChapter: {
    id: number;
    name: string;
    slug: string;
    price: number;
    content: string;
  };
  nextChapter: {
    id: number;
    name: string;
    slug: string;
  } | null;
  prevChapter: {
    id: number;
    name: string;
    slug: string;
  } | null;
  listChapter: {
    id: number;
    name: string;
    slug: string;
    chapter_number?: number;
    price?: number;
    updated_at?: string;
  }[];
}

function AdminStoriesContent(): ReactElement {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [newStory, setNewStory] = useState<NewStory>({
    name: "",
    slug: "",
    thumbnail: "",
    content: "",
    status: 1,
    is_public: true,
    authorIds: [],
    translatorIds: [],
    categoryIds: []
  });
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedComicId, setSelectedComicId] = useState<number | null>(null);
  const [chapterDetails, setChapterDetails] = useState<ChapterDetail | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<'thumbnail' | 'cover_image' | null>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const role = Cookies.get("role");
    
    if (!token) {
      router.push("/auth/login");
    } else {
      const roleNum = parseInt(role || "0");
      if (roleNum !== 1 && roleNum !== 2) {
        router.push("/auth/login");
      } else {
        setIsAdmin(true);
        fetchStories();
      }
    }
  }, [router]);

  useEffect(() => {
    fetchStories();
  }, [currentPage]);

  
  const fetchStories = async () => {
    try {
      setIsLoading(true);
  
      // Lấy token từ cookies
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
      }
  
      // Gửi yêu cầu GET với header Authorization
      const response = await axios.get<StoriesResponse>(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/home/user?page=${currentPage}&limit=${itemsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}` // Thêm token vào header
          }
        }
      );
  
      // Cập nhật state với dữ liệu trả về
      setStories(response.data.comicsRecent);
      setTotalItems(response.data.pagination.total);
    } catch (error) {
      console.error("Lỗi khi tải danh sách truyện:", error);
      setError("Không thể tải danh sách truyện. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapters = async () => {
    if (!selectedComicId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get<ChaptersResponse>(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/chapters/list/${selectedComicId}?page=${currentPage}&limit=${itemsPerPage}`
      );

      // Kiểm tra và xử lý dữ liệu response
      const chapters = Array.isArray(response.data.chapters) ? response.data.chapters : [];
      const total = response.data.pagination?.total || chapters.length;
      const page = response.data.pagination?.page || currentPage;

      setChapters(chapters);
      setTotalItems(total);
      setCurrentPage(page);
    } catch (error) {
      console.error("Lỗi khi tải danh sách chương:", error);
      setError("Không thể tải danh sách chương. Vui lòng thử lại.");
      // Reset data khi có lỗi
      setChapters([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = Cookies.get("token");
      const role = Cookies.get("role");
      
      if (!token) {
        setError("Bạn cần đăng nhập lại để thực hiện thao tác này");
        router.push("/auth/login");
        return;
      }


      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_API}/api/comics/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Xóa truyện thành công!");
      setShowDeleteConfirm(null);
      fetchStories(); // Refresh the list
    } catch (error: any) {
      console.error("Lỗi khi xóa truyện:", error);
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
      } else {
        setError("Không thể xóa truyện. Vui lòng thử lại.");
      }
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = Cookies.get("token");
      if (!token) {
        setError("Bạn cần đăng nhập lại để thực hiện thao tác này");
        router.push("/auth/login");
        return;
      }

      await axios.post("${process.env.NEXT_PUBLIC_BASE_API}/api/comics", newStory, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Thêm truyện thành công!");
      setShowAddModal(false);
      setNewStory({
        name: "",
        slug: "",
        thumbnail: "",
        content: "",
        status: 1,
        is_public: true,
        authorIds: [],
        translatorIds: [],
        categoryIds: []
      });
      fetchStories(); // Refresh the list
    } catch (error: any) {
      console.error("Lỗi khi thêm truyện:", error);
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
      } else {
        setError("Không thể thêm truyện. Vui lòng thử lại.");
      }
    }
  };

  const handleEditClick = (story: Story) => {
    setEditingStory({
      ...story,
      name: story.name || "",
      slug: story.slug || "",
      thumbnail: story.thumbnail || "",
      content: story.content || "",
      status: story.status || 1,
      is_public: story.is_public ?? true,
      authorIds: story.authorIds || [],
      translatorIds: story.translatorIds || [],
      categoryIds: story.categoryIds || [],
      description: story.description || "",
      cover_image: story.cover_image || "",
      view_total: story.view_total || 0,
      updated_at: story.updated_at || new Date().toISOString()
    });
    setShowEditModal(true);
  };

  const handleEditStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory) return;

    try {
      const token = Cookies.get("token");
      if (!token) {
        setError("Bạn cần đăng nhập lại để thực hiện thao tác này");
        router.push("/auth/login");
        return;
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/comics/${editingStory.id}`,
        {
          name: editingStory.name,
          slug: editingStory.slug,
          thumbnail: editingStory.thumbnail,
          content: editingStory.content,
          status: editingStory.status,
          is_public: editingStory.is_public,
          authorIds: editingStory.authorIds,
          translatorIds: editingStory.translatorIds,
          categoryIds: editingStory.categoryIds,
          description: editingStory.description,
          cover_image: editingStory.cover_image
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess("Cập nhật truyện thành công!");
      setShowEditModal(false);
      setEditingStory(null);
      fetchStories();
    } catch (error: any) {
      console.error("Lỗi khi cập nhật truyện:", error);
      if (error.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
      } else {
        setError("Không thể cập nhật truyện. Vui lòng thử lại.");
      }
    }
  };

  // Pagination handlers
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      pages.push(
        <li key="1" className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
        </li>
      );
      if (startPage > 2) {
        pages.push(
          <li key="ellipsis1" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <li key="ellipsis2" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
        </li>
      );
    }

    return (
      <nav aria-label="Page navigation" className="mt-4">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </button>
          </li>
          {pages}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </li>
        </ul>
        <div className="text-center mt-2">
          <small className="text-muted">
            Hiển thị {stories.length} / {totalItems} truyện
          </small>
        </div>
      </nav>
    );
  };

  // Thêm hàm xử lý chọn ảnh
  const handleImageSelect = (imageUrl: string) => {
    if (currentImageField === 'thumbnail') {
      if (showEditModal && editingStory) {
        setEditingStory(prev => ({
          ...prev!,
          thumbnail: imageUrl
        }));
      } else {
        setNewStory(prev => ({
          ...prev,
          thumbnail: imageUrl
        }));
      }
    } else if (currentImageField === 'cover_image') {
      if (showEditModal && editingStory) {
        setEditingStory(prev => ({
          ...prev!,
          cover_image: imageUrl
        }));
      } else {
        setNewStory(prev => ({
          ...prev,
          cover_image: imageUrl
        }));
      }
    }
    setShowImageSelector(false);
    setCurrentImageField(null);
  };

  const openImageSelector = (field: 'thumbnail' | 'cover_image') => {
    setCurrentImageField(field);
    setShowImageSelector(true);
  };

  const fetchStoryDetails = async (storyId: number) => {
    try {
      setIsLoading(true);
      setSelectedComicId(storyId);
      
      // Tìm truyện trong danh sách stories để lấy slug
      const selectedStory = stories.find(story => story.id === storyId);
      if (!selectedStory || !selectedStory.slug) {
        throw new Error('Không tìm thấy truyện hoặc slug truyện không hợp lệ');
      }
      
      // Lấy token từ cookies
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
      }
      
      // Lấy thông tin chi tiết truyện bằng API mới
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/home/${selectedStory.slug}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        console.log("Chi tiết truyện:", response.data.comic);
        
        // Lưu thông tin chi tiết truyện
        const comicDetail = response.data.comic;
        
        // Gán danh sách chương
        setChapters(comicDetail.Chapters || []);
        
        // Lưu thông tin vào currentChapter để hiển thị trong modal
        setChapterDetails({
          comics: {
            id: comicDetail.id,
            name: comicDetail.name,
            slug: comicDetail.slug,
            content: comicDetail.content,
            thumbnail: comicDetail.thumbnail,
            status: comicDetail.status,
            is_public: 1, // Giả định là công khai
            is_recommend: 0, // Giá trị mặc định
            origin_name: null,
            view_total: comicDetail.view_total || 0,
            view_day: 0, // Giá trị mặc định
            view_week: 0, // Giá trị mặc định
            view_month: 0, // Giá trị mặc định
            user_id: 0, // Giá trị mặc định
            created_at: comicDetail.updated_at || "",
            updated_at: comicDetail.updated_at || "",
            upview_at: null
          },
          currentChapter: comicDetail.Chapters && comicDetail.Chapters.length > 0 ? {
            id: comicDetail.Chapters[0].id,
            name: comicDetail.Chapters[0].name,
            slug: comicDetail.Chapters[0].slug,
            price: comicDetail.Chapters[0].price,
            content: ""
          } : {
            id: 0,
            name: "Chưa có chương",
            slug: "",
            price: 0,
            content: ""
          },
          nextChapter: comicDetail.Chapters && comicDetail.Chapters.length > 1 ? {
            id: comicDetail.Chapters[1].id,
            name: comicDetail.Chapters[1].name,
            slug: comicDetail.Chapters[1].slug
          } : null,
          prevChapter: null,
          listChapter: comicDetail.Chapters || []
        });
        
        setShowViewModal(true);
      } else {
        setError("Không thể tải thông tin chi tiết truyện");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin chi tiết truyện:", error);
      setError("Không thể tải thông tin chi tiết truyện. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm hàm fetchChapterDetails lại để xem chi tiết chương 
  const fetchChapterDetails = async (chapterId: number) => {
    try {
      setIsLoading(true);
      setSelectedChapterId(chapterId);
      
      // Lấy token từ cookies
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Token không tồn tại. Vui lòng đăng nhập lại.');
      }
      
      // Lấy chi tiết chương với API mới
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/chapters/chapter/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === "success") {
        console.log("Chi tiết chương:", response.data.data);
        setChapterDetails(response.data.data);
        setShowViewModal(true);
      } else {
        setError("Không thể tải thông tin chi tiết chương.");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin chi tiết chương:", error);
      setError("Không thể tải thông tin chi tiết chương. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="text-center mt-5">Đang kiểm tra quyền truy cập...</div>;
  }

  return (
    <div className="d-flex bg-black">
      {/* Sidebar */}
      <div className="bg-dark text-white vh-100 p-3 " style={{ width: "250px" }}>
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white">📚 Quản lý Truyện</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            Thêm Truyện Mới
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {isLoading ? (
          <div className="text-center">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                    <th>Ảnh</th>
                    <th>Tên Truyện</th>
                    <th>Lượt xem</th>
                    <th>Cập nhật</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
                  {stories.map((story: Story) => (
                <tr key={story.id}>
                  <td>{story.id}</td>
                      <td>
                        {story.thumbnail && (
                          <img 
                            src={story.thumbnail.startsWith('http') ? story.thumbnail : `${process.env.NEXT_PUBLIC_BASE_API}${story.thumbnail}`} 
                            alt={story.name} 
                            style={{ width: '50px', height: '70px', objectFit: 'cover' }}
                          />
                        )}
                      </td>
                  <td>{story.name}</td>
                      <td>{story.view_total?.toLocaleString()}</td>
                      <td>{new Date(story.updated_at || '').toLocaleDateString('vi-VN')}</td>
                      <td>
                        {story.status === 2 ? 'Hoàn thành' : 
                         story.status === 1 ? 'Tạm ngưng' : 'Đang cập nhật'}
                      </td>
                  <td>
                    <button 
                      className="btn btn-info btn-sm me-2"
                      onClick={() => fetchStoryDetails(story.id)}
                    >
                      Xem
                    </button>
                        <button 
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => handleEditClick(story)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => setShowDeleteConfirm(story.id)}
                        >
                          Xóa
                        </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            {renderPagination()}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteConfirm(null)}></button>
                </div>
                <div className="modal-body">
                  Bạn có chắc chắn muốn xóa truyện này?
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(showDeleteConfirm)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Story Modal */}
        {showAddModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Thêm Truyện Mới</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAddStory}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tên truyện</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newStory.name}
                          onChange={(e) => setNewStory({...newStory, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newStory.slug}
                          onChange={(e) => setNewStory({...newStory, slug: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Ảnh bìa</label>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control"
                          value={newStory.thumbnail}
                          onChange={(e) => setNewStory({...newStory, thumbnail: e.target.value})}
                          placeholder="URL ảnh bìa"
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={() => openImageSelector('thumbnail')}
                          style={{ height: 'fit-content' }}
                        >
                          Chọn ảnh
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nội dung</label>
                      <textarea
                        className="form-control"
                        value={newStory.content}
                        onChange={(e) => setNewStory({...newStory, content: e.target.value})}
                        rows={5}
                        required
                      />
                    </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Trạng thái</label>
                          <select
                            className="form-control"
                            value={newStory.status}
                            onChange={(e) => setNewStory({...newStory, status: parseInt(e.target.value)})}
                          >
                            <option value={1}>Đang cập nhật</option>
                            <option value={2}>Hoàn thành</option>
                            <option value={0}>Tạm ngưng</option>
                          </select>
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Công khai</label>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={newStory.is_public}
                              onChange={(e) => setNewStory({...newStory, is_public: e.target.checked})}
                            />
                            <label className="form-check-label">
                              {newStory.is_public ? 'Có' : 'Không'}
                            </label>
                          </div>
                        </div>
                      </div>

                    <div className="mb-3">
                      <label className="form-label">ID Tác giả (ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newStory.authorIds.join(',')}
                        onChange={(e) => setNewStory({
                          ...newStory, 
                          authorIds: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        })}
                        placeholder="Ví dụ: 1,2,3"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">ID Dịch giả (ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newStory.translatorIds.join(',')}
                        onChange={(e) => setNewStory({
                          ...newStory, 
                          translatorIds: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        })}
                        placeholder="Ví dụ: 1,2,3"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">ID Thể loại (ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newStory.categoryIds.join(',')}
                        onChange={(e) => setNewStory({
                          ...newStory, 
                          categoryIds: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        })}
                        placeholder="Ví dụ: 1,2,3"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowAddModal(false)}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                    >
                      Thêm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Story Modal */}
        {showEditModal && editingStory && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Sửa Truyện</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingStory(null);
                    }}
                  ></button>
                </div>
                <form onSubmit={handleEditStory}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tên truyện</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingStory.name}
                          onChange={(e) => setEditingStory({...editingStory, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Slug</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingStory.slug}
                          onChange={(e) => setEditingStory({...editingStory, slug: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Ảnh bìa</label>
                      <div className="d-flex gap-2">
                        <input
                          type="text"
                          className="form-control"
                          value={editingStory.thumbnail}
                          onChange={(e) => setEditingStory({...editingStory, thumbnail: e.target.value})}
                          placeholder="URL ảnh bìa"
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={() => openImageSelector('thumbnail')}
                          style={{ height: 'fit-content' }}
                        >
                          Chọn ảnh
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nội dung</label>
                      <textarea
                        className="form-control"
                        value={editingStory.content}
                        onChange={(e) => setEditingStory({...editingStory, content: e.target.value})}
                        rows={5}
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Trạng thái</label>
                        <select
                          className="form-control"
                          value={editingStory.status}
                          onChange={(e) => setEditingStory({...editingStory, status: parseInt(e.target.value)})}
                        >
                          <option value={1}>Đang cập nhật</option>
                          <option value={2}>Hoàn thành</option>
                          <option value={0}>Tạm ngưng</option>
                        </select>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Công khai</label>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={editingStory.is_public}
                            onChange={(e) => setEditingStory({...editingStory, is_public: e.target.checked})}
                          />
                          <label className="form-check-label">
                            {editingStory.is_public ? 'Có' : 'Không'}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">ID Tác giả (ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingStory.authorIds.join(',')}
                        onChange={(e) => setEditingStory({
                          ...editingStory, 
                          authorIds: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        })}
                        placeholder="Ví dụ: 1,2,3"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">ID Dịch giả (ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingStory.translatorIds.join(',')}
                        onChange={(e) => setEditingStory({
                          ...editingStory, 
                          translatorIds: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        })}
                        placeholder="Ví dụ: 1,2,3"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">ID Thể loại (ngăn cách bởi dấu phẩy)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingStory.categoryIds.join(',')}
                        onChange={(e) => setEditingStory({
                          ...editingStory, 
                          categoryIds: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        })}
                        placeholder="Ví dụ: 1,2,3"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingStory(null);
                      }}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Story Details Modal */}
        {showViewModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedChapterId ? `Chi Tiết Chương: ${chapterDetails?.currentChapter?.name}` : 'Chi Tiết Truyện'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowViewModal(false);
                      setChapterDetails(null);
                      setSelectedChapterId(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {isLoading ? (
                    <div className="text-center p-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                      <p className="mt-3">Đang tải dữ liệu...</p>
                    </div>
                  ) : chapterDetails ? (
                    <div>
                      {/* Thông tin truyện */}
                      <div className="mb-4 p-3 border rounded bg-light">
                        <div className="d-flex align-items-start">
                          {chapterDetails.comics.thumbnail && (
                            <div className="me-3">
                              <img 
                                src={chapterDetails.comics.thumbnail.startsWith('http') 
                                  ? chapterDetails.comics.thumbnail 
                                  : `${process.env.NEXT_PUBLIC_BASE_API}${chapterDetails.comics.thumbnail}`} 
                                alt={chapterDetails.comics.name} 
                                className="img-thumbnail"
                                style={{ width: '100px', height: '150px', objectFit: 'cover' }}
                              />
                            </div>
                          )}
                          <div className="flex-grow-1">
                            <h4 className="mb-2">{chapterDetails.comics.name}</h4>
                            <div className="row">
                              <div className="col-md-6">
                                <p className="mb-1"><strong>ID:</strong> {chapterDetails.comics.id}</p>
                                <p className="mb-1"><strong>Slug:</strong> {chapterDetails.comics.slug}</p>
                                <p className="mb-1">
                                  <strong>Trạng thái:</strong> {chapterDetails.comics.status === 1 
                                    ? 'Đang cập nhật' 
                                    : chapterDetails.comics.status === 2 
                                      ? 'Hoàn thành' 
                                      : 'Tạm ngưng'
                                  }
                                </p>
                              </div>
                              <div className="col-md-6">
                                <p className="mb-1">
                                  <strong>Lượt xem:</strong> {chapterDetails.comics.view_total.toLocaleString('vi-VN')}
                                </p>
                                <p className="mb-1">
                                  <strong>Số chương:</strong> {chapterDetails.listChapter.length}
                                </p>
                                <p className="mb-1">
                                  <strong>Thời gian cập nhật:</strong> {chapterDetails.comics.updated_at ? new Date(chapterDetails.comics.updated_at).toLocaleString('vi-VN') : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <h6 className="mb-1">Thể loại:</h6>
                              <div className="d-flex flex-wrap gap-1">
                                {(() => {
                                  const selectedStory = stories.find(s => s.id === selectedComicId);
                                  if (selectedStory) {
                                    return (
                                      <div className="d-flex flex-wrap gap-1">
                                        {selectedStory.categoryIds?.map((id, index) => (
                                          <span key={id} className="badge bg-secondary">{id}</span>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            <p className="mb-1 mt-2">
                              <strong>Nội dung:</strong> <span className="text-muted">{chapterDetails.comics.content.slice(0, 200)}...</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Chi tiết chương khi đã chọn một chương cụ thể */}
                      {selectedChapterId && chapterDetails.currentChapter && (
                        <div className="mb-4">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Chương: {chapterDetails.currentChapter.name}</h5>
                            <div>
                              {chapterDetails.prevChapter && (
                                <button 
                                  className="btn btn-sm btn-outline-primary me-2"
                                  onClick={() => {
                                    if (chapterDetails.prevChapter) {
                                      fetchChapterDetails(chapterDetails.prevChapter.id);
                                    }
                                  }}
                                >
                                  ← Chương trước
                                </button>
                              )}
                              {chapterDetails.nextChapter && (
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    if (chapterDetails.nextChapter) {
                                      fetchChapterDetails(chapterDetails.nextChapter.id);
                                    }
                                  }}
                                >
                                  Chương sau →
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="card mb-3">
                            <div className="card-header d-flex justify-content-between">
                              <div>
                                <strong>ID:</strong> {chapterDetails.currentChapter.id} | 
                                <strong> Slug:</strong> {chapterDetails.currentChapter.slug}
                              </div>
                              <div>
                                <span className={`badge ${Number(chapterDetails.currentChapter.price) > 0 ? 'bg-info' : 'bg-success'}`}>
                                  {Number(chapterDetails.currentChapter.price) > 0 
                                    ? `${Number(chapterDetails.currentChapter.price).toLocaleString('vi-VN')}đ` 
                                    : 'Miễn phí'}
                                </span>
                              </div>
                            </div>
                            <div className="card-body">
                              <h6 className="mb-3">Nội dung:</h6>
                              {(() => {
                                try {
                                  // Thử parse nội dung thành mảng các URL hình ảnh
                                  const contentStr = chapterDetails.currentChapter.content;
                                  const images = JSON.parse(contentStr);
                                  
                                  if (Array.isArray(images) && images.length > 0) {
                                    return (
                                      <div className="d-flex flex-column gap-3">
                                        {images.map((url, idx) => (
                                          <div key={idx} className="text-center border p-2">
                                            <p className="mb-2 text-muted small">Ảnh {idx + 1}</p>
                                            <img 
                                              src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_BASE_API}${url}`}
                                              alt={`Ảnh ${idx + 1}`} 
                                              style={{ maxWidth: "100%", maxHeight: "500px" }} 
                                              className="img-fluid mb-2"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="alert alert-warning">
                                        Không có hình ảnh nào trong chương này.
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  // Nếu không parse được JSON, hiển thị nội dung dạng text
                                  const content = chapterDetails.currentChapter.content || "";
                                  return (
                                    <div className="alert alert-info">
                                      <p className="mb-2">{content}</p>
                                      <p className="text-muted small">Lưu ý: Không thể hiển thị nội dung dưới dạng ảnh.</p>
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Danh sách chương - chỉ hiển thị khi không xem chi tiết một chương cụ thể */}
                      {!selectedChapterId && (
                        <div className="row">
                          <div className="col-md-12">
                            <div className="mb-4">
                              <h5 className="mb-3">Danh sách chương ({chapterDetails.listChapter.length})</h5>
                              <div className="table-responsive">
                                <table className="table table-striped table-bordered">
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Tên chương</th>
                                      <th>Số chương</th>
                                      <th>Slug</th>
                                      <th>Giá</th>
                                      <th>Ngày cập nhật</th>
                                      <th>Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {chapterDetails.listChapter.map((chapter, index) => (
                                      <tr key={chapter.id}>
                                        <td>{index + 1}</td>
                                        <td>{chapter.name}</td>
                                        <td>{chapter.chapter_number !== undefined ? chapter.chapter_number : 'N/A'}</td>
                                        <td>{chapter.slug}</td>
                                        <td>
                                          <span className={`badge ${chapter.price !== undefined && Number(chapter.price) > 0 ? 'bg-info' : 'bg-success'}`}>
                                            {chapter.price !== undefined && Number(chapter.price) > 0 
                                              ? `${Number(chapter.price).toLocaleString('vi-VN')}đ` 
                                              : 'Miễn phí'}
                                          </span>
                                        </td>
                                        <td>{chapter.updated_at ? new Date(chapter.updated_at).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                        <td>
                                          <Link 
                                            href={`/admin/chapters`}
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => {
                                              setShowViewModal(false);
                                            }}
                                          >
                                            Quản lý chương
                                          </Link>
                                          <button
                                            className="btn btn-sm btn-info"
                                            onClick={() => fetchChapterDetails(chapter.id)}
                                          >
                                            Xem chi tiết
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      Không có dữ liệu chi tiết truyện.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {selectedChapterId ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => {
                        setSelectedChapterId(null);
                        // Nếu đang xem chi tiết một chương, quay lại danh sách chương
                        const targetStory = stories.find(s => s.id === selectedComicId);
                        if (targetStory) {
                          fetchStoryDetails(targetStory.id);
                        }
                      }}
                    >
                      Quay lại danh sách chương
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => {
                        const targetStory = stories.find(s => s.id === selectedComicId);
                        if (targetStory) {
                          handleEditClick(targetStory);
                          setShowViewModal(false);
                        }
                      }}
                    >
                      Sửa truyện
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowViewModal(false);
                      setChapterDetails(null);
                      setSelectedChapterId(null);
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ImageSelector
          show={showImageSelector}
          onHide={() => setShowImageSelector(false)}
          onSelect={handleImageSelect}
        />
      </div>
    </div>
  );
}

export default AdminStoriesContent;


