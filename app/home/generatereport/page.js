"use client";
import React, { useState } from "react";
import readXlsxFile from "read-excel-file";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import {
  Container,
  Typography,
  Button,
  TextField,
  Table,
  Input,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";

const Generatereport = () => {
  const [projectData, setProjectData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [report, setReport] = useState("");

  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith(".xlsx")) {
      alert("กรุณาเลือกไฟล์ .xlsx เท่านั้น");
      return;
    }
    readXlsxFile(file)
      .then((rows) => {
        if (fileType === "project") {
          setProjectData(rows);
        } else if (fileType === "inventory") {
          setInventoryData(rows);
        }
      })
      .catch((error) => console.error("เกิดข้อผิดพลาดในการอ่านไฟล์:", error));
  };

  // ฟังก์ชันลบแถว
  const handleDeleteRow = (rowIndex) => {
    setProjectData((prevData) => {
      const newData = [...prevData];
      newData.splice(rowIndex + 1, 1); // +1 เพราะ rowIndex ของ .slice(1) ไม่ตรงกับ index จริง
      return newData;
    });
  };

  const generateReport = () => {
    let reportText = "";
    let currentBuilding = null;
    let buildingIndex = 1; // สำหรับการแสดงลำดับอาคาร
    let subItemIndex = 1; // ตัวแปรสำหรับหมายเลขย่อย

    // สร้างรายงานจาก Project Data
    projectData.forEach((row) => {
      const [no, detail, quantity, unit] = row;

      // ข้ามการแสดงแถวที่มี no เป็น "ลำดับ"
      if (no === "ลำดับ" || no === "ลำดับที่") {
        return; // ข้ามไปยังแถวถัดไป
      }

      // ตรวจสอบหาชื่ออาคาร โดยใช้เลขลำดับในช่อง "ลำดับ"
      if (no && detail) {
        currentBuilding = detail;
        reportText += `\n${no}. ${currentBuilding}\n`; // ใช้เลขลำดับจากช่อง "ลำดับ"
        buildingIndex++;
        subItemIndex = 1; // รีเซ็ตหมายเลขย่อยเมื่อเจออาคารใหม่
      }

      // เพิ่มรายละเอียดในรายงาน
      if (currentBuilding && detail && !no) {
        const quantityText = quantity
          ? `จำนวน: ${quantity} ${unit}`
          : "จำนวน: ไม่ระบุ";

        if (
          detail
            .replace(/\s+/g, " ")
            .toLowerCase()
            .includes("รวมติดตั้ง access point") ||
          detail
            .replace(/\s+/g, " ")
            .toLowerCase()
            .includes("รวมติดตั้ง acess point")
        ) {
          const accessPoints = inventoryData.filter(
            ([, deviceType, , , , , , , location]) =>
              deviceType &&
              (deviceType.toLowerCase() === "accesspoint" ||
                deviceType.toLowerCase() === "access point") &&
              location &&
              location.includes(currentBuilding)
          );

          accessPoints.forEach(
            (
              [, , brand, model, serialNumber, , deviceName, , location],
              index
            ) => {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex} ติดตั้ง Access Point ${brand} ${model} (${deviceName}) S/N: ${serialNumber} Location: ${location}\n`;
            }
          );
        } else if (detail.toLowerCase().includes("switch")) {
          // helper สำหรับ normalize model
          const normalize = (str) =>
            str ? str.toLowerCase().replace(/[\s\-]/g, "") : "";

          // กรอง switch ตามประเภท + อาคาร
          const Switches = inventoryData.filter(
            ([, deviceType, , , , , , , location]) =>
              deviceType &&
              (deviceType.toLowerCase() === "switch" ||
                deviceType.toLowerCase() === "switch poe" ||
                deviceType.toLowerCase() === "switch sfp" ||
                deviceType.toLowerCase() === "core switch") &&
              location &&
              location.includes(currentBuilding)
          );
          // console.log("find switch",Switches)

          // กรองให้เหลือ switch ที่มี model ตรงกับ detail
          const matchedSwitch = Switches.find(([, , , model]) => {
            const d = normalize(detail);
            const m = normalize(model);
            return d.includes(m) || m.includes(d);
          });

          // console.log("sw", matchedSwitch);
          // console.log("detail:", detail);
          // console.log("currentBuilding:", currentBuilding);
          // console.log("Switches in building:", Switches);

          if (matchedSwitch) {
            const [
              ,
              deviceType,
              brand,
              model,
              serialNumber,
              ,
              deviceName,
              ,
              location,
            ] = matchedSwitch;

            if (deviceType.toLowerCase() === "switch poe") {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex} ติดตั้ง Switch POE ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
            } else if (deviceType.toLowerCase() === "switch sfp") {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex} ติดตั้ง Switch SFP ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
            } else {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex} ติดตั้ง Switch ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
            }
          }
        } else if (detail.includes("Router") || detail.includes("router")) {
          const Router = inventoryData.filter(
            ([, deviceType, , , , , , , location]) =>
              deviceType &&
              deviceType.toLowerCase() === "router" &&
              location &&
              location.includes(currentBuilding)
          );

          // กรองให้เหลือ switch ที่มี model ตรงกับ detail
          const matchedRouter = Router.find(([, , , model]) =>
            detail.includes(model)
          );
          console.log("Router", matchedRouter);

          if (matchedRouter) {
            // ถ้ามี switch ที่ตรงกับ detail ให้เพิ่มข้อมูลใน reportText
            const [, , brand, model, serialNumber, , deviceName, , location] =
              matchedRouter;
            reportText += `${
              buildingIndex - 1
            }.${subItemIndex} ติดตั้ง Router ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
          }
        } else if (detail.toLowerCase().includes("ups")) {
          const ups = inventoryData.filter(
            ([, deviceType, , , , , , , location]) =>
              deviceType &&
              deviceType.toLowerCase() === "ups" &&
              location &&
              location.includes(currentBuilding)
          );

          // ตรวจสอบ ups ที่มี model ตรงกับ detail
          const matchedUps = ups.filter(([, , , model]) =>
            detail?.toLowerCase().includes(model?.toLowerCase() || "")
          );

          // แสดงผลเฉพาะข้อมูลที่ตรงกับ model ใน detail
          matchedUps.forEach(
            (
              [, , brand, model, serialNumber, , deviceName, , location],
              index
            ) => {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex} ติดตั้ง UPS ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
            }
          );
        } else if (
          detail.toLowerCase().includes("wall") &&
          detail.toLowerCase().includes("rack")
        ) {
          reportText += `${
            buildingIndex - 1
          }.${subItemIndex} ติดตั้ง${detail} ${quantityText}\n`;
        } else if (
          () => {
            const d = detail.toLowerCase(); // แปลงเป็นพิมพ์เล็กก่อนเช็ค
            return (
              d.includes("รวมค่าใช้จ่ายทั้งโครงการ") ||
              d.includes("ภาษีมูลค่าเพิ่ม") ||
              d.includes("1.25g") ||
              d.includes("10g") ||
              d.includes("patch cord") ||
              d.includes("wi-fi") ||
              d.includes("wifi") ||
              d.includes("wireless") ||
              d.includes("rack mount") ||
              d.includes("odf wall outdoor") ||
              d.includes("ground")
            );
          }
        ) {
          // ข้ามรายละเอียดที่ไม่เกี่ยวข้องกับอุปกรณ์
          return;
        } else {
          reportText += `${
            buildingIndex - 1
          }.${subItemIndex} ${detail} ${quantityText}\n`;
        }

        // ถ้าจำนวนมากกว่า 1 ให้สร้างหัวข้อย่อย
        if (
          quantity > 1 &&
          (detail.includes("รวมติดตั้ง") ||
            detail.includes("Outlet LAN") ||
            detail.includes("Outlet"))
        ) {
          // เพิ่มในฟังก์ชัน generateReport หลังจากที่ตรวจสอบเงื่อนไข quantity > 1
          const d = detail.toLowerCase();

          if (
            d.includes("รวมติดตั้ง access point") ||
            d.includes("รวมติดตั้ง acess point") ||
            (d.includes("รวมติดตั้ง") && d.includes("acess point")) ||
            (d.includes("รวมติดตั้ง") && d.includes("access point"))
          ) {
            const accessPoints = inventoryData.filter(
              ([, deviceType, , , , , , , location]) =>
                deviceType &&
                (deviceType.toLowerCase() === "accesspoint" ||
                  deviceType.toLowerCase() === "access point") &&
                location &&
                location.includes(currentBuilding)
            );
            console.log("building", currentBuilding, accessPoints);

            accessPoints.forEach(
              (
                [, , brand, model, serialNumber, , deviceName, , location],
                index
              ) => {
                reportText += `${buildingIndex - 1}.${subItemIndex}.${
                  index + 1
                } ติดตั้ง Access Point ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
              }
            );
          } else if (
            detail.includes("Outlet LAN") ||
            detail.includes("Outlet")
          ) {
            for (let i = 1; i <= quantity; i++) {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex}.${i} Outlet LAN \n`;
            }
          } else {
            // ถ้าจำนวนมากกว่า 1 ให้สร้างหัวข้อย่อยปกติ
            for (let i = 1; i <= quantity; i++) {
              reportText += `${
                buildingIndex - 1
              }.${subItemIndex}.${i} ${detail}\n`;
            }
          }
        }

        subItemIndex++; // เพิ่มหมายเลขย่อยเมื่อมีรายละเอียด
      }
    });

    setReport(reportText);
  };

  // ฟังก์ชันสำหรับส่งออกเป็นไฟล์ Word
  const exportToWord = async () => {
    const reportSections = report
      .split("\n")
      .filter((line) => line.trim() !== ""); // ลบบรรทัดว่าง

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: reportSections.map((section) => {
            return new Paragraph({
              children: [
                new TextRun({
                  text: section,
                  font: "TH SarabunPSK", // ฟอนต์ภาษาไทย
                  size: 32, // 16 pt (หน่วยใน docx คือ half-point)
                }),
              ],
              spacing: { before: 200, after: 200 },
            });
          }),
        },
      ],
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `รายงานโครงการ_${new Date().toISOString().slice(0, 10)}.docx`
      );
    } catch (error) {
      console.error("Error while exporting to Word:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกไฟล์ Word. กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <Container
      maxWidth="100%"
      sx={{ py: 4, bgcolor: "grey.50", minHeight: "100vh", padding: "100px" }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        color="text.primary"
        gutterBottom
      >
        Upload Files
      </Typography>

      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2}>
        <Box component={Paper} elevation={3} p={2} textAlign="center">
          <Typography variant="h6" fontWeight="medium">
            Project File
          </Typography>
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => handleFileUpload(e, "project")}
            fullWidth
          />
        </Box>
        <Box component={Paper} elevation={3} p={2} textAlign="center">
          <Typography variant="h6" fontWeight="medium">
            Inventory File
          </Typography>
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => handleFileUpload(e, "inventory")}
            fullWidth
          />
        </Box>
      </Box>

      {projectData.length > 0 && (
        <Box mt={6}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Project Data
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {projectData[0].map((header, idx) => (
                    <TableCell
                      key={idx}
                      sx={{ fontWeight: "medium", bgcolor: "grey.200" }}
                    >
                      {header}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: "medium", bgcolor: "grey.200" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projectData.slice(1).map((row, idx) => (
                  <TableRow key={idx} hover>
                    {row.map((cell, cellIdx) => (
                      <TableCell key={cellIdx}>{cell}</TableCell>
                    ))}
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteRow(idx)}
                      >
                        ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {inventoryData.length > 0 && (
        <Box mt={6}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Inventory Data
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {inventoryData[0].map((header, idx) => (
                    <TableCell
                      key={idx}
                      sx={{ fontWeight: "medium", bgcolor: "grey.200" }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {inventoryData.slice(1).map((row, idx) => (
                  <TableRow key={idx} hover>
                    {row.map((cell, cellIdx) => (
                      <TableCell key={cellIdx}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box mt={4}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ py: 1.5, mb: 2 }}
          onClick={generateReport}
        >
          Generate Report
        </Button>
        {report && (
          <Box
            sx={{
              mt: 6,
              p: 4,
              bgcolor: "white",
              boxShadow: 1,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Generated Report
            </Typography>
            <Box
              sx={{
                whiteSpace: "pre-wrap",
                color: "grey.700",
                bgcolor: "grey.100",
                p: 3,
                borderRadius: 2,
                overflow: "auto",
                fontFamily: "Arial, sans-serif", // กำหนดฟอนต์
                fontSize: "1.5rem", // ขนาดฟอนต์
              }}
            >
              {report.split("\n").map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </Box>
            <Button
              onClick={exportToWord}
              variant="contained"
              color="success"
              sx={{ mt: 3 }}
            >
              Export Report to Word
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Generatereport;
