import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/DashBoard.css";
import UserManage from "./UserManage.js";
import PerformanceManage from "./PerformanceManage.js";
import BookedSeatDetail from "./BookedSeatDetail.js";
import BookedSeatManage from "./BookedSeatManage.js";
import SeatSelection from "./SeatSelection.js";
import AnnouncementManage from "./AnnouncementManage.js";
import ManagerEnroll from "./ManagerEnroll.js";
import UserManageDetail from "./UserManageDetail.js";
import AnnouncementDetail from "./AnnouncementDetail.js";
import PerformanceNew from "./PerformanceNew.js";
import PerformanceDetail from "./PerformanceDetail.js";
import Quill from "./Quill.jsx";
import InquiryManage from "./InquiryManage.js";
import InquiryDetail from "./InquiryDetail.js";
import MainPage from "./MainPage.js";
import styled, { keyframes } from "styled-components";
import { NavLink, Route, Routes } from "react-router";
import ManagerEnrollDetail from "./ManagerEnrollDetail.js";

// react-router-dom 이용한 라우팅 방법
// react-router-dom : React 애플리케이션에서 라우팅을 구현하기 위해 사용하는 라이브러리
// 라우팅(router) : 사용자가 요청한 URL 경로에 따라 적절한 페이지 or 리소스 제공하는 과정
export default function DashBoard() {
  // 스타일드 컴포넌트 정의
  const Title = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    padding: 0 20px;
  `;

  const StyledNavLink = styled(NavLink)`
    text-decoration: none;
    color: white;
    font-size: 2rem;
    padding: 20px 20px; // 패딩값 증가
    border-radius: 4px;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  `;

  const BackButton = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    background-color: #4a90e2;
    color: white;
    padding: 2px;
    border-radius: 4px;
    transition: background-color 0.2s;
    width: 32px;
    height: 32px;

    &:hover {
      background-color: #357abd;
    }

    svg {
      width: 30px;
      height: 30px;
      fill: currentColor;
    }
  `;

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const checkAdminStatus = async () => {
  //     const storedAdminAuth = localStorage.getItem("adminAuth");
  //     const storedAdminToken = localStorage.getItem("adminToken");

  //     // 인증 정보가 있으면 바로 인증 상태를 유지
  //     if (storedAdminAuth && storedAdminToken) {
  //       setIsAdmin(true);
  //       setIsLoading(false);
  //       return;
  //     }

  //     try {
  //       const params = new URLSearchParams(window.location.search);
  //       const stateParam = params.get("state");

  //       if (!stateParam) {
  //         window.location.href = "http://192.168.50.236";
  //         return;
  //       }

  //       const state = JSON.parse(atob(decodeURIComponent(stateParam)));

  //       if (new Date().getTime() - state.timestamp > 5 * 60 * 1000) {
  //         localStorage.removeItem("adminAuth");
  //         localStorage.removeItem("adminToken");
  //         window.location.href = "http://192.168.50.236";
  //         return;
  //       }

  //       // API 호출로 관리자 권한 확인
  //       const response = await fetch(
  //         "http://192.168.50.236:8081/admin/auth",
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //             Accept: "application/json", // 명시적으로 JSON 응답 요청
  //           },
  //           body: JSON.stringify({
  //             memberEmail: state.memberEmail,
  //             memberNo: state.memberNo,
  //           }),
  //         }
  //       );

  //       const checkData = await response.json();

  //       if (!response.ok) {
  //         throw new Error(checkData.message || "관리자 권한 확인 실패");
  //       }

  //       if (!checkData.accessToken) {
  //         throw new Error("인증 토큰이 없습니다");
  //       }

  //       localStorage.setItem("adminAuth", "true");
  //       localStorage.setItem("adminToken", checkData.accessToken);
  //       setIsAdmin(true);

  //       const newUrl = window.location.pathname;
  //       window.history.replaceState({}, "", newUrl);
  //     } catch (error) {
  //       console.error("관리자 검증 실패. 전체 에러:", error);
  //       localStorage.removeItem("adminAuth");
  //       localStorage.removeItem("adminToken");
  //       //window.location.href = "http://modeunticket.store/";
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   checkAdminStatus();
  // }, []); // 빈 배열을 넣으면 컴포넌트가 처음 마운트될 때만 실행됨

  // if (isLoading) return <div>Loading...</div>;
  // if (!isAdmin) return null;

  return (
    <div className="dash-board-container">
      <Title className="dash-board-title">
        <StyledNavLink to="/">관리자 페이지</StyledNavLink>
        <BackButton
          href="http://192.168.50.236"
          onClick={() => {
            localStorage.removeItem("adminAuth");
            localStorage.removeItem("adminToken");
          }}
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </BackButton>
      </Title>

      <div className="main-show-container">
        {/* 라우터 탭 */}
        <div className="router-tab-box">
          <NavLink to="/UserManage">유저관리</NavLink>
          <NavLink to="/PerformanceManage">공연장 관리</NavLink>
          <NavLink to="/BookedSeatManage">예매 좌석 관리</NavLink>
          <NavLink to="/AnnouncementManage">공지사항 관리</NavLink>
          <NavLink to="/InquiryManage">문의 내역 관리</NavLink>
          <NavLink to="/ManagerEnroll">업체계정 신청</NavLink>
        </div>

        {/* 라우터 콘텐츠 */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/UserManage" element={<UserManage />} />
            <Route path="/PerformanceManage" element={<PerformanceManage />} />
            <Route path="/BookedSeatManage" element={<BookedSeatManage />} />
            <Route
              path="/AnnouncementManage"
              element={<AnnouncementManage />}
            />
            <Route path="/ManagerEnroll" element={<ManagerEnroll />} />
            <Route path="/member/:memberNo" element={<UserManageDetail />} />
            <Route
              path="/announcement/:announceNo"
              element={<AnnouncementDetail />}
            />
            <Route
              path="/manager/:concertManagerNo"
              element={<ManagerEnrollDetail />}
            />
            <Route
              path="/performance/:mt10ID"
              element={<PerformanceDetail />}
            />
            <Route path="/inquiry/:inquiryNo" element={<InquiryDetail />} />
            <Route path="/PerformanceNew" element={<PerformanceNew />} />
            <Route
              path="/seatManage/detail/:mt20id"
              element={<BookedSeatDetail />}
            />
            <Route path="/seatManage/bookingSeat" element={<SeatSelection />} />
            <Route path="/quill" element={<Quill />} />
            <Route path="/InquiryManage" element={<InquiryManage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
