import { useEffect, useRef, useState } from "react";
import axios from "axios";
import styled, { keyframes } from "styled-components";
import { axiosApi } from "./../api/axoisAPI";
import { useNavigate } from "react-router-dom";

// Animation keyframes
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
  }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #fff;
  max-width: 1200px;
  margin: 0 auto;
`;

const FormSection = styled.div`
  flex: 1;
`;

const FormWrapper = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #ff7f27;
    box-shadow: 0 0 0 2px rgba(255, 127, 39, 0.1);
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-top: 10px;

  &:hover {
    background-color: #059669;
  }

  &:disabled {
    background-color: #d1d5db;
    cursor: not-allowed;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
  display: flex;
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

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;

// Grade related components
const GradeCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  font-size: 0.9em;
  color: #666;
`;

const AnimatedContainer = styled.div`
  overflow: hidden;
  animation: ${slideDown} 0.3s ease-out forwards;
`;

const GradesContainer = styled.div`
  margin-top: 10px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GradeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GradeCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 1rem;
  padding: 4px 4px;
  border-radius: 4px;
  background-color: ${(props) => (props.checked ? "#e2e8f0" : "transparent")};
  transition: background-color 0.2s;

  &:hover {
    background-color: #e2e8f0;
  }
`;

const GradeInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  animation: ${slideDown} 0.3s ease-out forwards;
`;

const SeatInput = styled(Input)`
  width: 100px;
`;

// Map related components
const MapSection = styled.div`
  flex: 1;
  padding: 20px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const SuggestionName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const SuggestionAddress = styled.div`
  font-size: 12px;
  color: #666;
`;

const MapContainer = styled.div`
  width: 500px;
  height: 400px;
`;

const LocationInfo = styled.div`
  margin-top: 20px;
`;

const LocationText = styled.p`
  margin: 8px 0;
  color: #555;
  font-size: 14px;
`;

const PerformanceForm = () => {
  // Refs
  const container = useRef(null);
  const mapInstanceRef = useRef(null);

  // States
  const [formData, setFormData] = useState({
    MT10ID: "",
    FCLTYNM: "",
    MT13CNT: "",
    FCLTYCHARTR: "공공(문예회관)",
    OPENDE: "",
    SEATSCALE: "",
    TELNO: "",
    RELATEURL: "",
    ADRES: "",
    FCLTLA: "",
    FCLTLO: "",
  });

  const [searchKeyword, setSearchKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isShowSuggestions, setIsShowSuggestions] = useState(false);
  const [searchType] = useState("keyword");
  const [showGrades, setShowGrades] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [gradeSeats, setGradeSeats] = useState({});
  const [existingIds, setExistingIds] = useState([]);

  // Error states
  const [idError, setIdError] = useState("");
  const [seatError, setSeatError] = useState("");
  const [selectedGradeError, setSelectedGradeError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Constants
  const GRADE_ORDER = ["VIP", "R", "S", "A", "B", "전석"];
  const GRADE_MAPPING = {
    VIP: 1,
    R: 2,
    S: 3,
    A: 4,
    B: 5,
    전석: 6,
  };

  // Effects
  useEffect(() => {
    const getExistingIds = async () => {
      try {
        const resp = await axiosApi.get("/performance/IDCheck");
        if (resp.status === 200) {
          const ids = resp.data
            .map((item) => item.mt10ID)
            .filter((id) => id !== null);
          setExistingIds(ids);
        }
      } catch (error) {
        console.error("ID 목록 조회 실패:", error);
      }
    };

    getExistingIds();
  }, []);

  useEffect(() => {
    if (!formData.SEATSCALE || parseInt(formData.SEATSCALE) <= 0) {
      // 객석수가 비어있거나 0 이하일 때는 등급 관련 상태만 초기화
      setShowGrades(false);
      setSelectedGrades([]);
      setGradeSeats({});
      return;
    }

    // 객석수가 있을 때만 유효성 검사 진행
    if (showGrades && selectedGrades.length > 0) {
      const totalSeats = parseInt(formData.SEATSCALE);
      const totalGradeSeats = Object.values(gradeSeats).reduce(
        (sum, val) => sum + (parseInt(val) || 0),
        0
      );

      if (totalGradeSeats > totalSeats) {
        setSeatError(
          `총 객석수(${totalSeats})보다 등급별 좌석 합계(${totalGradeSeats})가 많습니다.`
        );
      } else if (totalGradeSeats < totalSeats) {
        setSeatError(
          `총 객석수(${totalSeats})와 등급별 좌석 합계(${totalGradeSeats})가 일치하지 않습니다.`
        );
      } else {
        setSeatError("");
      }
    }
  }, [formData.SEATSCALE]); // 객석수 변경시에만 실행

  // 등급 좌석 검사를 위한 별도의 useEffect
  useEffect(() => {
    if (showGrades && selectedGrades.length > 0) {
      const invalidSeats = selectedGrades.some((grade) => {
        const seatCount = gradeSeats[GRADE_MAPPING[grade]];
        return !seatCount || parseInt(seatCount) < 1;
      });

      if (invalidSeats) {
        setSelectedGradeError("좌석 수는 1 이상 입력해주세요.");
      } else {
        setSelectedGradeError("");
      }
    } else {
      setSelectedGradeError("");
    }
  }, [gradeSeats, selectedGrades, showGrades]);

  useEffect(() => {
    const loadMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        return setTimeout(loadMap, 100);
      }

      const map = new window.kakao.maps.Map(container.current, {
        center: new window.kakao.maps.LatLng(33.450701, 126.570667),
        level: 3,
      });

      mapInstanceRef.current = map;
    };

    loadMap();
  }, []);

  // useEffect를 추가해주세요 (loadMap useEffect 바로 위에)
  useEffect(() => {
    // Cleanup function
    return () => {
      setFormData({
        MT10ID: "",
        FCLTYNM: "",
        MT13CNT: "",
        FCLTYCHARTR: "공공(문예회관)",
        OPENDE: "",
        SEATSCALE: "",
        TELNO: "",
        RELATEURL: "",
        ADRES: "",
        FCLTLA: "",
        FCLTLO: "",
      });
      setShowGrades(false);
      setSelectedGrades([]);
      setGradeSeats({});
    };
  }, []);

  // Validation functions
  const validateLocation = () => {
    if (!formData.ADRES || !formData.FCLTLA || !formData.FCLTLO) {
      setLocationError("지도에서 위치를 선택해주세요.");
      return false;
    }
    setLocationError("");
    return true;
  };

  const validatePhone = (phone) => {
    const pattern = /^\d{2,3}-\d{3,4}-\d{4}$/;
    if (!pattern.test(phone)) {
      setPhoneError("전화번호는 xxx-xxxx-xxxx 형식으로 입력해주세요.");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validateMT10ID = (id) => {
    const pattern = /^FC\d+$/;
    if (!pattern.test(id)) {
      setIdError(
        "공연장 ID는 FC(대문자)로 시작하고 뒤에는 숫자만 입력 가능합니다."
      );
      return false;
    }

    if (existingIds.includes(id)) {
      setIdError("이미 존재하는 공연장 ID입니다.");
      return false;
    }

    setIdError("");
    return true;
  };

  const validateGradeSeats = () => {
    if (!showGrades) return true;

    let hasError = false;
    selectedGrades.forEach((grade) => {
      const seatCount = gradeSeats[GRADE_MAPPING[grade]];
      if (!seatCount || parseInt(seatCount) < 1) {
        setSelectedGradeError(`${grade} 좌석 수를 1 이상 입력해주세요.`);
        hasError = true;
      }
    });

    if (!hasError) {
      setSelectedGradeError("");
    }

    return !hasError;
  };

  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "SEATSCALE") {
      const numValue = parseInt(value);
      // 빈 문자열이거나 0, 음수인 경우
      if (value === "" || numValue <= 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: "",
        }));
        setShowGrades(false);
        setSelectedGrades([]);
        setGradeSeats({});
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 객석수가 비어있거나 0인 경우 등급지정 관련 상태 초기화
    if (name === "SEATSCALE") {
      const numValue = parseInt(value);
      if (!value || numValue <= 0) {
        setShowGrades(false);
        setSelectedGrades([]);
        setGradeSeats({});
      }
      // 음수나 0이 입력되었을 경우 값을 비움
      if (numValue <= 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: "",
        }));
        return;
      }
    }

    if (name === "MT10ID") {
      validateMT10ID(value);
    } else if (name === "TELNO") {
      validatePhone(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateMT10ID(formData.MT10ID)) return;
    if (!validateLocation()) return;
    if (!validateGradeSeats()) return;
    if (!validatePhone(formData.TELNO)) return;
    if (seatError) {
      alert("좌석 수를 올바르게 입력해주세요.");
      return;
    }

    const seatData = {};
    if (showGrades) {
      Object.entries(gradeSeats).forEach(([gradeId, seatCount]) => {
        if (seatCount !== "") {
          seatData[gradeId] = parseInt(seatCount);
        }
      });
    }

    const submitData = {
      ...formData,
      gradeSeats: showGrades ? seatData : null,
    };

    try {
      const response = await axios.post(
        "http://192.168.50.236:8081/performance/insert",
        submitData
      );
      if (response.data > 0) {
        alert("시설 정보가 성공적으로 등록되었습니다.");
        window.history.back();
      } else {
        alert("등록 실패하였습니다");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("오류가 발생했습니다");
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchKeyword(value);

    if (!value.trim()) {
      setSuggestions([]);
      setIsShowSuggestions(false);
      return;
    }

    if (searchType === "keyword") {
      const ps = new window.kakao.maps.services.Places();
      ps.keywordSearch(value, (data, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSuggestions(data);
          setIsShowSuggestions(true);
        }
      });
    }
  };

  const handleGradeChange = (grade) => {
    setSelectedGrades((prev) => {
      if (prev.includes(grade)) {
        const newGrades = prev.filter((g) => g !== grade);
        setGradeSeats((seats) => {
          const newSeats = { ...seats };
          delete newSeats[GRADE_MAPPING[grade]];
          return newSeats;
        });
        return newGrades;
      }
      return [...prev, grade].sort(
        (a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
      );
    });
  };

  const handleGradeSeatChange = (grade, value) => {
    const gradeId = GRADE_MAPPING[grade];
    const newValue = value === "" ? "" : parseInt(value);

    setGradeSeats((prev) => ({
      ...prev,
      [gradeId]: newValue,
    }));
  };

  const handlePlaceClick = (place) => {
    setSearchKeyword(place.place_name);
    const coords = new window.kakao.maps.LatLng(place.y, place.x);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(coords);
      new window.kakao.maps.Marker({
        map: mapInstanceRef.current,
        position: coords,
      });
    }

    setFormData({
      ...formData,
      ADRES: place.address_name,
      FCLTLA: place.y,
      FCLTLO: place.x,
    });
    setLocationError("");
    setIsShowSuggestions(false);
  };

  return (
    <Container>
      <FormSection>
        <FormWrapper>
          <Title>
            <BackArrow
              className="fas fa-arrow-left"
              onClick={() => window.history.back()}
            />
            공연장 등록
          </Title>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>공연장 ID:</Label>
              <Input
                type="text"
                name="MT10ID"
                value={formData.MT10ID}
                onChange={handleChange}
                required
              />
              {idError && <ErrorText>{idError}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>공연장명:</Label>
              <Input
                type="text"
                name="FCLTYNM"
                value={formData.FCLTYNM}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>시설특성:</Label>
              <Input
                type="text"
                name="FCLTYCHARTR"
                value={formData.FCLTYCHARTR}
                onChange={handleChange}
                placeholder="공공(문예회관)"
              />
            </FormGroup>

            <FormGroup>
              <Label>개관년도:</Label>
              <Input
                type="text"
                name="OPENDE"
                value={formData.OPENDE}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>공연장 시설 수:</Label>
              <Input
                type="number"
                name="MT13CNT"
                value={formData.MT13CNT}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Label>객석수:</Label>
                  <Input
                    type="number"
                    name="SEATSCALE"
                    value={formData.SEATSCALE}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
                <GradeCheckboxContainer>
                  <input
                    type="checkbox"
                    id="showGrades"
                    checked={showGrades}
                    disabled={
                      !formData.SEATSCALE || parseInt(formData.SEATSCALE) === 0
                    }
                    onChange={(e) => setShowGrades(e.target.checked)}
                  />
                  <label htmlFor="showGrades">등급지정</label>
                </GradeCheckboxContainer>
              </div>

              {showGrades && (
                <AnimatedContainer>
                  <GradesContainer>
                    <GradeRow>
                      {GRADE_ORDER.map((grade) => (
                        <GradeCheckbox
                          key={grade}
                          checked={selectedGrades.includes(grade)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGrades.includes(grade)}
                            onChange={() => handleGradeChange(grade)}
                          />
                          {grade}
                        </GradeCheckbox>
                      ))}
                    </GradeRow>

                    {selectedGrades.map((grade) => (
                      <GradeInput key={grade}>
                        <Label>{grade} 좌석:</Label>
                        <SeatInput
                          type="number"
                          value={gradeSeats[GRADE_MAPPING[grade]] || ""}
                          onChange={(e) =>
                            handleGradeSeatChange(grade, e.target.value)
                          }
                          min="1"
                          onBlur={(e) => {
                            if (
                              e.target.value === "" ||
                              parseInt(e.target.value) < 1
                            ) {
                              setSelectedGradeError(
                                "좌석 수는 1 이상 입력해주세요."
                              );
                            }
                          }}
                          placeholder="1 이상 입력"
                        />
                      </GradeInput>
                    ))}

                    {selectedGradeError && (
                      <ErrorText>{selectedGradeError}</ErrorText>
                    )}
                    {seatError && <ErrorText>{seatError}</ErrorText>}
                  </GradesContainer>
                </AnimatedContainer>
              )}
            </FormGroup>

            <FormGroup>
              <Label>전화번호:</Label>
              <Input
                type="tel"
                name="TELNO"
                value={formData.TELNO}
                onChange={handleChange}
                placeholder="000-0000-0000"
                required
              />
              {phoneError && <ErrorText>{phoneError}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>홈페이지:</Label>
              <Input
                type="string"
                name="RELATEURL"
                value={formData.RELATEURL}
                onChange={handleChange}
              />
            </FormGroup>

            <SubmitButton
              type="submit"
              disabled={
                seatError !== "" ||
                idError !== "" ||
                selectedGradeError !== "" ||
                locationError !== "" ||
                phoneError !== "" ||
                existingIds.includes(formData.MT10ID)
              }
            >
              제출
            </SubmitButton>
          </Form>
        </FormWrapper>
      </FormSection>

      <MapSection>
        <SearchContainer>
          <SearchInput
            type="text"
            value={searchKeyword}
            onChange={handleInputChange}
            placeholder="주소를 검색하세요"
          />

          {isShowSuggestions && suggestions.length > 0 && (
            <SuggestionsContainer>
              {suggestions.map((place, index) => (
                <SuggestionItem
                  key={index}
                  onClick={() => handlePlaceClick(place)}
                >
                  <SuggestionName>{place.place_name}</SuggestionName>
                  <SuggestionAddress>{place.address_name}</SuggestionAddress>
                </SuggestionItem>
              ))}
            </SuggestionsContainer>
          )}
        </SearchContainer>

        <MapContainer ref={container} />

        <LocationInfo>
          <LocationText>
            주소: {formData.ADRES || "위치를 선택해주세요"}
          </LocationText>
          <LocationText>위도: {formData.FCLTLA || "-"}</LocationText>
          <LocationText>경도: {formData.FCLTLO || "-"}</LocationText>
          {locationError && <ErrorText>{locationError}</ErrorText>}
        </LocationInfo>
      </MapSection>
    </Container>
  );
};

export default PerformanceForm;
