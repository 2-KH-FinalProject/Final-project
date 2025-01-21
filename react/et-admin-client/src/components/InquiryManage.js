import React, { useEffect, useState } from "react";
import { axiosApi } from "../api/axoisAPI.js";
import { useNavigate } from "react-router-dom";
import "./Quill.jsx";
import axios from "axios";
import styled from "styled-components";

// 페이지네이션 스타일 컴포넌트
const PaginationContainer = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 30px;
  padding: 20px 0;
`;

const PageButton = styled.button`
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 32px;
  font-size: 12px;
  font-weight: bold;
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

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

const DeleteButton = styled.button`
  width: 32px;
  height: 32px;
  background-color: #ef4444;
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
  transition: all 0.2s;

  &:hover {
    background-color: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
  }

  i {
    font-size: 14px;
  }
`;

// 테이블 관련 스타일 컴포넌트들
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
  table-layout: auto;
`;

const TableHeader = styled.th`
  padding: 15px;
  background-color: #ff7f27;
  color: white;
  font-weight: 600;
  text-align: center;
  font-size: 14px;
  white-space: nowrap;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:hover {
    background-color: #fff3e0;
  }
  cursor: pointer;
  border-bottom: 1px solid #eeeeee;
  height: 50px;
`;

const TableCell = styled.td`
  padding: 12px 15px;
  color: #333;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;

  &:last-child {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
  }
`;

// 새로 추가할 styled-component
const SearchIcon = styled.i`
  padding: 10px;
  color: #ff7f27;
  font-size: 18px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    color: #e65d00;
    transform: scale(1.1);
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

  // totalPages > 1 조건 제거
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

// InquiryList 컴포넌트
const InquiryList = ({
  inquiryList,
  currentPage,
  itemsPerPage,
  onPageChange,
  isReplied,
  setIsReplied,
}) => {
  const navigate = useNavigate();

  const handleDelete = async (e, inquiryNo) => {
    e.stopPropagation();

    if (window.confirm("정말로 이 문의사항을 삭제하시겠습니까?")) {
      try {
        const response = await axios.post(
          `http://192.168.50.236:8081/inquiry/delete/${inquiryNo}`
        );
        if (response.data > 0) {
          alert("문의사항이 삭제되었습니다.");
          sessionStorage.setItem("isReplied", String(isReplied));
          sessionStorage.setItem("replyIs", isReplied ? "Y" : "N");
          window.location.reload();
        } else {
          alert("삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("삭제 중 에러 발생:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = inquiryList.slice(indexOfFirstItem, indexOfLastItem);

  // 전체 목록 기준 번호 생성 함수
  const getListNumber = (index) => {
    return indexOfFirstItem + index + 1;
  };

  return (
    <section>
      {inquiryList.length === 0 ? (
        <p>문의사항이 없습니다.</p>
      ) : (
        <>
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
                {currentItems.map((inquiry, index) => (
                  <TableRow
                    key={inquiry.inquiryNo}
                    onClick={() => navigate(`/inquiry/${inquiry.inquiryNo}`)}
                  >
                    <TableCell>{getListNumber(index)}</TableCell>
                    <TableCell>{inquiry.inquiryTitle}</TableCell>
                    <TableCell>{inquiry.inquiryDate}</TableCell>
                    <TableCell>
                      <DeleteButton
                        onClick={(e) => handleDelete(e, inquiry.inquiryNo)}
                      >
                        <i className="fas fa-times"></i>
                      </DeleteButton>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </StyledTable>
          </TableContainer>
          <Pagination
            totalItems={inquiryList.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={onPageChange} // 부모로부터 받은 onPageChange 함수를 그대로 전달
          />
        </>
      )}
    </section>
  );
};

// 메인 InquiryManage 컴포넌트
export default function InquiryManage() {
  const [inquiryList, setInquiryList] = useState([]);
  const [selectedValue, setSelectedValue] = useState("제목");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [isReplied, setIsReplied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const navigate = useNavigate();

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

  const options = [
    { id: 1, label: "제목" },
    { id: 2, label: "내용" },
    { id: 3, label: "등록날짜" },
  ];

  const getInquiryList = async () => {
    try {
      const replyStatus = isReplied ? "Y" : "N";
      const resp = await axiosApi.post("/inquiry/showInquiryList", {
        replyIs: replyStatus,
      });

      if (resp.status === 200) {
        setInquiryList(resp.data);
      }
    } catch (error) {
      console.log("문의사항 조회 오류:", error);
    }
  };

  const handleToggle = async () => {
    // 토글 상태를 먼저 업데이트
    const newReplyStatus = !isReplied;
    setIsReplied(newReplyStatus);

    // 검색어가 있는 경우 검색을 다시 실행
    if (inputValue.trim()) {
      try {
        const formData = {
          selectedValue,
          inputValue,
          replyIs: newReplyStatus ? "Y" : "N",
        };

        const resp = await axiosApi.post(
          "/inquiry/searchInquiryList",
          formData
        );
        if (resp.status === 200) {
          setInquiryList(resp.data);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("검색 오류:", error);
      }
    } else {
      // 검색어가 없는 경우 전체 목록 조회
      try {
        const resp = await axiosApi.post("/inquiry/showInquiryList", {
          replyIs: newReplyStatus ? "Y" : "N",
        });
        if (resp.status === 200) {
          setInquiryList(resp.data);
          setCurrentPage(1);
        }
      } catch (error) {
        console.log("목록 조회 오류:", error);
      }
    }
  };

  // 기존의 두 useEffect를 제거하고 하나의 useEffect로 통합
  useEffect(() => {
    const init = async () => {
      // 세션 스토리지에서 저장된 상태 확인
      const savedIsReplied = sessionStorage.getItem("isReplied");
      const savedReplyIs = sessionStorage.getItem("replyIs");

      // 저장된 상태가 있으면 적용
      if (savedIsReplied !== null) {
        setIsReplied(savedIsReplied === "true");
        try {
          const resp = await axiosApi.post("/inquiry/showInquiryList", {
            replyIs: savedReplyIs,
          });
          if (resp.status === 200) {
            setInquiryList(resp.data);
            setLoading(false);
          }
        } catch (error) {
          console.error("데이터 로드 에러:", error);
          setLoading(false);
        }
      } else {
        // 저장된 상태가 없으면 기본 데이터 로드
        try {
          const resp = await axiosApi.post("/inquiry/showInquiryList", {
            replyIs: "N",
          });
          if (resp.status === 200) {
            setInquiryList(resp.data);
            setLoading(false);
          }
        } catch (error) {
          console.error("데이터 로드 에러:", error);
          setLoading(false);
        }
      }

      // 세션 스토리지 클리어
      sessionStorage.removeItem("isReplied");
      sessionStorage.removeItem("replyIs");
    };

    init();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // loading 상태 체크를 위한 useEffect는 유지
  useEffect(() => {
    if (inquiryList != null) {
      setLoading(false);
    }
  }, [inquiryList]);

  useEffect(() => {
    if (inquiryList != null) {
      setLoading(false);
    }
  }, [inquiryList]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputValue || inputValue.trim() === "") {
      alert("검색어를 입력해주세요");
      return;
    }

    const formData = {
      selectedValue: selectedValue,
      inputValue: inputValue,
      replyIs: isReplied ? "Y" : "N",
    };

    try {
      const resp = await axiosApi.post("/inquiry/searchInquiryList", formData);

      if (resp.status === 200) {
        setInquiryList(resp.data);
        setCurrentPage(1);
      } else {
        throw new Error("서버 요청 실패");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return (
    <div className="menu-box">
      <TitleContainer
        onClick={() => {
          setIsReplied(false);
          getInquiryList();
          setCurrentPage(1);
          setInputValue("");
          setSelectedValue("제목");
        }}
      >
        <h4>문의내역</h4>
      </TitleContainer>

      <div className="search-and-toggle-container">
        <div className="toggle-container">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isReplied}
              onChange={handleToggle}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {isReplied ? "답변 완료" : "미답변"}
          </span>
        </div>
        <div className="search-container">
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
            <SearchIcon className="fas fa-search" onClick={handleSubmit} />
          </form>
        </div>
      </div>

      <div className="main-table-container" style={{ textAlign: "center" }}>
        <InquiryList
          inquiryList={inquiryList}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          isReplied={isReplied} // 추가: isReplied 상태 전달
          setIsReplied={setIsReplied} // 추가: setIsReplied 함수 전달
        />
      </div>
    </div>
  );
}
