import React, { useEffect, useState } from "react";
import { axiosApi } from "../api/axoisAPI";
import { useNavigate } from "react-router-dom";
import "./Quill.jsx";
import axios from "axios";
import styled from "styled-components";

// 페이지네이션 스타일
const PaginationContainer = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 30px;
  padding: 20px 0;
`;

const PageButton = styled.button`
  width: 32px; // min-width → width
  height: 32px;
  padding: 0; // 0 6px → 0
  display: flex; // 추가
  align-items: center; // 추가
  justify-content: center; // 추가
  border: 1px solid ${(props) => (props.active ? "#ff7f27" : "#e0e0e0")};
  border-radius: 4px;
  background-color: ${(props) => (props.active ? "#ff7f27" : "white")};
  color: ${(props) => (props.active ? "white" : "#333")};
  font-size: 14px;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? "0.5" : "1")};
  transition: all 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.active ? "#ff7f27" : "#fff3e0")};
    border-color: #ff7f27;
    color: ${(props) => (props.active ? "white" : "#ff7f27")};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const ArrowButton = styled(PageButton)`
  width: 32px; // 추가
  font-size: 12px; // 14px → 12px
  font-weight: bold;
  min-width: 28px;
  padding: 0 4px;

  &:disabled {
    background-color: #f5f5f5;
    border-color: #e0e0e0;
    cursor: not-allowed;
  }
`;

const PageNumbersContainer = styled.div`
  display: flex;
  gap: 8px;
`;

// 테이블 스타일
const TableContainer = styled.div`
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  table-layout: auto; /* 추가 */
`;

const TableHeader = styled.th`
  padding: 15px;
  background-color: #ff7f27;
  color: white;
  font-weight: 600;
  text-align: center;
  font-size: 14px;
  white-space: nowrap;
  vertical-align: middle; // 세로 중앙 정렬 추가
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #fff3e0;
  }
  cursor: pointer;
  border-bottom: 1px solid #eeeeee;
  height: 50px; // 행의 높이를 고정하여 일관된 정렬 유지
`;

const TableCell = styled.td`
  padding: 12px 15px;
  color: #333;
  text-align: center; // 이 부분이 확실히 적용되도록
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle; // 세로 중앙 정렬 추가

  /* 삭제 버튼 컨테이너 중앙 정렬 */
  &:last-child {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
  }
`;

const DeleteButton = styled.button`
  width: 32px;
  height: 32px;
  background-color: #ef4444; // 변경
  color: white;
  font-size: 14px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: all 0.2s; // all로 변경하여 모든 속성에 트랜지션 적용

  &:hover {
    background-color: #dc2626; // 변경
    transform: translateY(-2px); // 추가
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2); // 추가
  }

  i {
    font-size: 14px;
  }
`;

const TitleContainer = styled.div`
  width: fit-content;
  margin: 20px auto;
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff7f27 0%, #ff9f5b 100%);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(255, 127, 39, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;

  h4 {
    margin: 0;
    font-size: 24px;
    color: white;
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
  }

  /* 반응형 스타일 */
  @media screen and (max-width: 768px) {
    padding: 8px 16px;
    h4 {
      font-size: 20px;
    }
  }

  @media screen and (max-width: 480px) {
    width: 90%;
    margin: 15px auto;
    h4 {
      font-size: 18px;
    }
  }

  @media screen and (max-width: 320px) {
    padding: 6px 12px;
    h4 {
      font-size: 16px;
    }
  }

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

// 페이지네이션 컴포넌트
const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const pageRange = 5;
  const startPage = Math.max(1, currentPage - Math.floor(pageRange / 2));
  const endPage = Math.min(totalPages, startPage + pageRange - 1);

  if (totalItems === 0) return null;

  return (
    <PaginationContainer>
      <ArrowButton onClick={() => onPageChange(1)} disabled={currentPage === 1}>
        {"<<"}
      </ArrowButton>
      <ArrowButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {"<"}
      </ArrowButton>

      {[...Array(endPage - startPage + 1)].map((_, index) => {
        const pageNumber = startPage + index;
        return (
          <PageButton
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            active={currentPage === pageNumber}
          >
            {pageNumber}
          </PageButton>
        );
      })}

      <ArrowButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {">"}
      </ArrowButton>
      <ArrowButton
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        {">>"}
      </ArrowButton>
    </PaginationContainer>
  );
};

// 메인 컴포넌트
export default function AnnouncementManage() {
  const [announcementList, setAnnouncementList] = useState([]);
  const [selectedValue, setSelectedValue] = useState("제목");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    getAnnouncementList();
  }, []);

  const getAnnouncementList = async () => {
    try {
      const resp = await axiosApi.get("/announcement/showAnnouncementList");
      if (resp.status === 200) {
        setAnnouncementList(resp.data);
        setLoading(false);
      }
    } catch (error) {
      console.log("Error:", error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSelectedValue(e.target.value);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue || inputValue.trim() === "") {
      alert("검색어를 입력해주세요");
      return;
    }

    try {
      const resp = await axiosApi.post("/announcement/searchAnnouncementList", {
        selectedValue,
        inputValue,
      });

      if (resp.status === 200) {
        setAnnouncementList(resp.data);
        setCurrentPage(1); // 검색 후 첫 페이지로 이동
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const options = [
    { id: 1, label: "제목" },
    { id: 2, label: "내용" },
    { id: 3, label: "등록날짜" },
  ];

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="menu-box">
      <TitleContainer
        onClick={() => {
          getAnnouncementList();
          setCurrentPage(1);
          setInputValue("");
          setSelectedValue("제목");
        }}
      >
        <h4>공지사항</h4>
      </TitleContainer>
      <div>
        <form>
          <select value={selectedValue} onChange={handleChange}>
            {options.map((option) => (
              <option key={option.id} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
          />
          <i
            className="fas fa-search search-icon"
            onClick={handleSubmit}
            style={{ cursor: "pointer" }}
          />
        </form>
      </div>
      <div className="main-table-container">
        <TableContainer>
          <StyledTable>
            <thead>
              <tr>
                <TableHeader style={{ width: "10%" }}>번호</TableHeader>
                <TableHeader style={{ width: "45%" }}>제목</TableHeader>
                <TableHeader style={{ width: "30%" }}>등록날짜</TableHeader>
                <TableHeader style={{ width: "15%" }}>관리</TableHeader>
              </tr>
            </thead>
            <tbody>
              {announcementList
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((announcement, index) => {
                  const listNumber =
                    (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <TableRow
                      key={announcement.announceNo}
                      onClick={(e) => {
                        if (e.target.closest(".delete-button")) return;
                        navigate(`/announcement/${announcement.announceNo}`);
                      }}
                    >
                      <TableCell>{listNumber}</TableCell>
                      <TableCell>{announcement.announceTitle}</TableCell>
                      <TableCell>{announcement.announceWriteDate}</TableCell>
                      <TableCell>
                        <DeleteButton
                          className="delete-button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "정말로 이 공지사항을 삭제하시겠습니까?"
                              )
                            ) {
                              try {
                                const response = await axios.post(
                                  `http://192.168.50.236:8081/announcement/delete/${announcement.announceNo}`
                                );
                                if (response.data > 0) {
                                  alert("공지사항이 삭제되었습니다.");
                                  getAnnouncementList();
                                } else {
                                  alert("삭제에 실패했습니다.");
                                }
                              } catch (error) {
                                console.error("삭제 중 에러 발생:", error);
                                alert("삭제 중 오류가 발생했습니다.");
                              }
                            }
                          }}
                        >
                          <i className="fas fa-times" />
                        </DeleteButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </tbody>
          </StyledTable>
        </TableContainer>
        <Pagination
          totalItems={announcementList.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
      <div className="write-button-container">
        <button className="write-button" onClick={() => navigate("/quill")}>
          글쓰기
        </button>
      </div>
    </div>
  );
}
