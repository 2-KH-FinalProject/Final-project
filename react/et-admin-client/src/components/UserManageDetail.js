import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import styled from "styled-components";

// 스타일드 컴포넌트 정의
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
`;

const ErrorMessage = styled.span`
  color: red;
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 640px) {
    width: 100%;
    padding: 0.875rem;
  }
`;

const BackButton = styled(Button)`
  background-color: #4b5563;
  color: white;

  &:hover {
    background-color: #374151;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  }
`;

const SubmitButton = styled(Button)`
  background-color: #10b981;
  color: white;
  opacity: ${(props) => (props.disabled ? "0.5" : "1")};

  &:hover:not(:disabled) {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
  }

  &:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #ef4444;
  color: white;

  &:hover {
    background-color: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
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

const MemberUpdate = () => {
  const { memberNo } = useParams();
  const [formData, setFormData] = useState({
    nickname: "",
    address: "",
    tel: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isValidPhone, setIsValidPhone] = useState(true);

  useEffect(() => {
    axios
      .get(`http://192.168.50.236:8081/member/${memberNo}`)
      .then((response) => {
        const memberData = response.data[0];
        setFormData({
          nickname: memberData.memberNickname || "",
          address: memberData.memberAddress || "",
          tel: memberData.memberTel || "",
        });
        setIsValidPhone(validatePhoneNumber(memberData.memberTel || ""));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [memberNo]);

  const validatePhoneNumber = (number) => {
    if (!number) return true;
    const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
    return phoneRegex.test(number);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 전화번호 유효성 검사
    if (name === "tel") {
      const isValid = validatePhoneNumber(value);
      setIsValidPhone(isValid);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await axios.post(
        `http://192.168.50.236:8081/member/delete/${memberNo}`
      );
      if (response.status === 200) {
        alert("회원이 삭제되었습니다.");
        window.history.back();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("회원 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isValidPhone) {
      alert("전화번호 형식을 확인해주세요.");
      return;
    }

    const formdata = {
      memberNickname: formData.nickname,
      memberAddress: formData.address,
      memberTel: formData.tel,
    };

    axios
      .post(
        `http://192.168.50.236:8081/member/update/${memberNo}`,
        formdata
      )
      .then((response) => {
        if (response.data > 0) {
          alert("회원 정보가 수정되었습니다");
          window.history.back();
        } else {
          alert("정보 수정이 실패하였습니다");
        }
      })
      .catch((error) => {
        console.error(error);
        alert("회원 정보 수정에 실패했습니다.");
      });
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

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
          회원 정보 수정
        </Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>닉네임:</Label>
            <Input
              type="text"
              name="nickname"
              value={formData.nickname || ""}
              onChange={handleChange}
            />
          </FormGroup>
          <FormGroup>
            <Label>주소:</Label>
            <Input
              type="text"
              name="address"
              value={formData.address || ""}
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
            />
            {!isValidPhone && formData.tel && (
              <ErrorMessage>XXX-XXXX-XXXX 형식으로 입력해주세요.</ErrorMessage>
            )}
          </FormGroup>
          <ButtonGroup>
            <BackButton type="button" onClick={() => window.history.back()}>
              뒤로가기
            </BackButton>
            <SubmitButton type="submit" disabled={!isValidPhone}>
              수정하기
            </SubmitButton>
            <DeleteButton type="button" onClick={handleDelete}>
              회원삭제
            </DeleteButton>
          </ButtonGroup>
        </Form>
      </FormWrapper>
    </Container>
  );
};

export default MemberUpdate;
