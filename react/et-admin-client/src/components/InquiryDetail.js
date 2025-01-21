import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styled, { keyframes } from "styled-components";

// 스타일 컴포넌트 정의
const Container = styled.div`
  max-width: 800px;
  margin: 40px auto;
  padding: 30px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  position: relative;
  padding-left: 40px;
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
`;

const BackArrow = styled.i`
  position: absolute;
  left: 0;
  color: #ff7f27;
  cursor: pointer;
  font-size: 24px;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateX(-5px);
  }
`;

const InfoContainer = styled.div`
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  padding-bottom: 20px;
`;

const WriterInfo = styled.span`
  position: relative;
  padding-right: 20px;

  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 12px;
    background-color: #ddd;
  }
`;

const DateInfo = styled.span``;

const Content = styled.div`
  min-height: 200px;
  padding: 25px;
  background-color: #f8f9fa;
  border-radius: 8px;
  line-height: 1.6;
  margin-bottom: 30px;
  white-space: pre-wrap;
`;

const ReplyContainer = styled.div`
  margin-top: 30px;
  padding: 20px;
  background-color: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  animation: ${(props) => {
      if (props.isEditing) return slideUpAndFade;
      if (props.isReturning) return slideDownAndFade;
      return "none";
    }}
    0.3s ease-out forwards;
  opacity: 1; // 기본 opacity 추가
`;

const ReplyTitle = styled.h3`
  color: #007bff;
  margin-bottom: 15px;
  font-size: 18px;
`;

const ReplyText = styled.div`
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;
`;

const ReplyButton = styled.button`
  padding: 12px 35px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ReplyFormContainer = styled.div`
  margin-top: 20px;
  animation: ${(props) => (props.isExiting ? slideUp : slideDown)} 0.3s ease
    forwards;
`;

const ReplyInput = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f5f5f5;
  resize: vertical;
  margin-bottom: 15px;
  font-size: 15px;
  line-height: 1.6;

  &:focus {
    outline: none;
    border-color: #ff7f27;
    box-shadow: 0 0 0 2px rgba(255, 127, 39, 0.1);
  }
`;

const ReplyButtonGroup = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 15px;
  margin-top: 15px;
`;

const Button = styled.button`
  padding: 12px 30px;
  border: none;
  border-radius: 5px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
`;

const CancelButton = styled(Button)`
  background-color: #f44336;
  color: white;

  &:hover {
    background-color: #da190b;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(244, 67, 54, 0.2);
  }
`;

const SubmitButton = styled(Button)`
  background-color: #4caf50;
  color: white;

  &:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
  }
`;

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
`;

const EditButton = styled(Button)`
  background-color: #4caf50;
  color: white;
  margin-top: 10px;

  &:hover {
    background-color: #45a049;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
  }
`;

const slideUpAndFade = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-30px);
  }
`;

const slideDownAndFade = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 수정하기 버튼 위치 조정을 위한 새로운 스타일
const EditButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

export default function InquiryDetail() {
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const { inquiryNo } = useParams();
  const [isExiting, setIsExiting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplyExiting, setIsReplyExiting] = useState(false);
  const [isReplyReturning, setIsReplyReturning] = useState(false);
  const [showReplyContainer, setShowReplyContainer] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInquiry();
  }, [inquiryNo]);

  const fetchInquiry = async () => {
    try {
      const response = await axios.get(
        `http://192.168.50.236:8081/inquiry/${inquiryNo}`
      );
      const inquiryData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      if (inquiryData) {
        setInquiry(inquiryData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsReplyExiting(true); // 퇴장 애니메이션 시작

    setTimeout(() => {
      setShowReplyContainer(false); // 애니메이션 완료 후 컨테이너 숨김
      setReplyContent(inquiry.replyContent);
      setShowReplyForm(true);
      setIsEditing(true);
    }, 300); // 애니메이션 시간과 동일하게 설정
  };

  const handleCancel = () => {
    setIsReplyExiting(false); // 우선 퇴장 애니메이션 초기화
    setIsExiting(true); // 폼 퇴장 애니메이션 시작

    setTimeout(() => {
      setShowReplyForm(false);
      setReplyContent("");
      setIsEditing(false);
      setIsExiting(false);
      setShowReplyContainer(true); // 답글 컨테이너 표시
      setIsReplyReturning(true); // 등장 애니메이션 시작

      setTimeout(() => {
        setIsReplyReturning(false); // 등장 애니메이션 완료
      }, 300);
    }, 300);
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      alert("답글 내용을 입력해주세요.");
      return;
    }

    try {
      const response = await axios.post(
        `http://192.168.50.236:8081/inquiry/reply/${inquiryNo}`,
        {
          replyContent: replyContent,
        }
      );

      if (response.data > 0) {
        alert(isEditing ? "답글이 수정되었습니다." : "답글이 등록되었습니다.");

        // 폼 퇴장 애니메이션
        setIsExiting(true);

        setTimeout(async () => {
          // 데이터 업데이트
          await fetchInquiry();

          // 폼 관련 상태 초기화
          setShowReplyForm(false);
          setIsExiting(false);
          setReplyContent("");
          setIsEditing(false);

          // 답글 컨테이너 표시 및 애니메이션
          setShowReplyContainer(true);
          setIsReplyExiting(false); // 이 부분이 중요
          setIsReplyReturning(true);

          setTimeout(() => {
            setIsReplyReturning(false);
          }, 300);
        }, 300);
      } else {
        alert(isEditing ? "수정에 실패했습니다." : "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("처리 중 에러가 발생했습니다.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!inquiry) return <div>문의사항을 찾을 수 없습니다.</div>;

  return (
    <Container>
      <Title>
        <BackArrow
          className="fas fa-arrow-left"
          onClick={() => window.history.back()}
        />
        {inquiry.inquiryTitle}
      </Title>

      <InfoContainer>
        <WriterInfo>
          작성자: {inquiry.memberNickname} (회원코드:{inquiry.memberNo})
        </WriterInfo>
        <DateInfo>작성일: {inquiry.inquiryDate}</DateInfo>
      </InfoContainer>

      <Content>{inquiry.inquiryContent}</Content>

      {inquiry.replyContent && !showReplyForm && showReplyContainer && (
        <>
          <ReplyContainer
            isEditing={isReplyExiting}
            isReturning={isReplyReturning}
            style={{ display: showReplyContainer ? "block" : "none" }}
          >
            <ReplyTitle>답변</ReplyTitle>
            <ReplyText>{inquiry.replyContent}</ReplyText>
          </ReplyContainer>
          <EditButtonContainer>
            <EditButton onClick={handleEdit}>수정하기</EditButton>
          </EditButtonContainer>
        </>
      )}

      <ButtonContainer>
        {(!inquiry.replyIs || inquiry.replyIs === "N") &&
          !showReplyForm &&
          !inquiry.replyContent && (
            <ReplyButton onClick={() => setShowReplyForm(true)}>
              답글달기
            </ReplyButton>
          )}
      </ButtonContainer>

      {showReplyForm && (
        <ReplyFormContainer isExiting={isExiting}>
          <ReplyInput
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력해주세요..."
          />
          <ReplyButtonGroup>
            <CancelButton onClick={handleCancel}>취소</CancelButton>
            <SubmitButton onClick={handleReplySubmit}>
              {isEditing ? "수정하기" : "작성하기"}
            </SubmitButton>
          </ReplyButtonGroup>
        </ReplyFormContainer>
      )}
    </Container>
  );
}
