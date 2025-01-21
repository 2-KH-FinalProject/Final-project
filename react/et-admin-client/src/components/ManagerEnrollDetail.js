import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import styled from "styled-components";

// Styled Components
const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #f3f4f6;
  padding: 2rem 1rem;
`;

const FormWrapper = styled.div`
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 2rem;

  @media (max-width: 640px) {
    padding: 1.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  &:read-only {
    background-color: #f8f9fa;
    cursor: default;
    border-color: #dee2e6;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s;
  min-height: 100px;
  height: auto;
  resize: vertical;
  white-space: pre-wrap;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  &:read-only {
    background-color: #f8f9fa;
    cursor: default;
    border-color: #dee2e6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  color: white;

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const BackButton = styled(Button)`
  background-color: #6b7280;

  &:hover {
    background-color: #4b5563;
  }
`;

const SubmitButton = styled(Button)`
  background-color: #3b82f6;
  position: relative;
  overflow: hidden;

  &:before,
  &:after,
  & span:before,
  & span:after,
  & div:before,
  & div:after,
  & i:before,
  & i:after,
  & em:before,
  & em:after {
    content: "";
    position: absolute;
    width: 2px;
    height: 2px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    box-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
    opacity: 0;
  }

  &:before {
    top: 20%;
    left: 30%;
  }
  &:after {
    top: 60%;
    left: 70%;
  }
  & span:before {
    top: 40%;
    left: 20%;
  }
  & span:after {
    top: 30%;
    left: 80%;
  }
  & div:before {
    top: 70%;
    left: 40%;
  }
  & div:after {
    top: 45%;
    left: 60%;
  }
  & i:before {
    top: 25%;
    left: 50%;
  }
  & i:after {
    top: 50%;
    left: 25%;
  }
  & em:before {
    top: 80%;
    left: 65%;
  }
  & em:after {
    top: 15%;
    left: 75%;
  }

  &:hover {
    background-color: #2563eb;

    &:before {
      animation: twinkle 1s infinite 0.1s;
    }
    &:after {
      animation: twinkle 1.2s infinite 0.3s;
    }
    & span:before {
      animation: twinkle 0.9s infinite 0.5s;
    }
    & span:after {
      animation: twinkle 1.1s infinite 0.7s;
    }
    & div:before {
      animation: twinkle 1.3s infinite 0.2s;
    }
    & div:after {
      animation: twinkle 1s infinite 0.4s;
    }
    & i:before {
      animation: twinkle 1.2s infinite 0.6s;
    }
    & i:after {
      animation: twinkle 0.9s infinite 0.8s;
    }
    & em:before {
      animation: twinkle 1.1s infinite 0.3s;
    }
    & em:after {
      animation: twinkle 1s infinite 0.5s;
    }
  }

  @keyframes twinkle {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
    60% {
      transform: scale(0.9);
      opacity: 0.8;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  & span,
  & div,
  & i,
  & em {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #dc3545;

  &:hover {
    background-color: #bb2d3b;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-size: 1.125rem;
  color: #3b82f6;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative; // 추가: 화살표의 절대 위치 기준점
  display: flex; // 추가: 화살표와 텍스트 정렬
  align-items: center;
  justify-content: center;
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

const ManagerEnrollDetail = () => {
  const { concertManagerNo } = useParams();
  const [formData, setFormData] = useState({
    nickname: "",
    address: "",
    tel: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://192.168.50.236:8081/manager/${concertManagerNo}`)
      .then((response) => {
        const memberData = response.data[0];
        setFormData({
          nickname: memberData.concertManagerNickname || "",
          tel: memberData.concertManagerTel || "",
          company: memberData.concertManagerCompany || "",
          comment: memberData.concertManagerCompanyComment || "",
          email: memberData.concertManagerEmail || "",
        });
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [concertManagerNo]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAgree = () => {
    axios
      .post(`http://192.168.50.236:8081/manager/agree/${concertManagerNo}`)
      .then((response) => {
        alert("승인이 완료되었습니다.");
        window.history.back();
      })
      .catch((error) => {
        console.error(error);
        alert("승인 처리에 실패했습니다.");
      });
  };

  const handleDelete = () => {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      axios
        .post(
          `http://192.168.50.236:8081/manager/delete/${concertManagerNo}`
        )
        .then((response) => {
          alert("삭제가 완료되었습니다.");
          window.history.back();
        })
        .catch((error) => {
          console.error(error);
          alert("삭제 처리에 실패했습니다.");
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const serverFormData = {
      memberNickname: formData.nickname,
      memberAddress: formData.address,
      memberTel: formData.tel,
    };

    axios
      .post(
        `http://192.168.50.236:8081/manager/update/${concertManagerNo}`,
        serverFormData
      )
      .then((response) => {
        alert(response.data);
      })
      .catch((error) => {
        console.error(error);
        alert("회원 정보 수정에 실패했습니다.");
      });
  };

  if (isLoading) {
    return <LoadingSpinner>Loading...</LoadingSpinner>;
  }

  return (
    <Container>
      <FormWrapper>
        <Title>
          <BackArrow
            className="fas fa-arrow-left"
            onClick={() => window.history.back()}
          />
          업체계정 신청정보
        </Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>닉네임:</Label>
            <Input
              type="text"
              name="nickname"
              value={formData.nickname || ""}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
          <FormGroup>
            <Label>전화번호:</Label>
            <Input
              type="text"
              name="tel"
              value={formData.tel || ""}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
          <FormGroup>
            <Label>회사명:</Label>
            <Input
              type="text"
              name="company"
              value={formData.company || ""}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
          <FormGroup>
            <Label>코멘트:</Label>
            <TextArea
              name="comment"
              value={formData.comment || ""}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
          <FormGroup>
            <Label>이메일:</Label>
            <Input
              type="text"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              readOnly
            />
          </FormGroup>
          <ButtonGroup>
            <BackButton type="button" onClick={() => window.history.back()}>
              뒤로가기
            </BackButton>
            <SubmitButton type="button" onClick={handleAgree}>
              허가
            </SubmitButton>
            <DeleteButton type="button" onClick={handleDelete}>
              삭제
            </DeleteButton>
          </ButtonGroup>
        </Form>
      </FormWrapper>
    </Container>
  );
};

export default ManagerEnrollDetail;
