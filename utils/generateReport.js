/**
 * Generates a text report from project + inventory Excel data.
 * Pure function — no side effects, no React state.
 *
 * @param {Array[]} projectData  - rows from project Excel (each row = array of cells)
 * @param {Array[]} inventoryData - rows from inventory Excel
 * @returns {string} reportText
 */
export function generateReport(projectData, inventoryData) {
  let reportText = "";
  let currentBuilding = null;
  let buildingIndex = 1;
  let subItemIndex = 1;

  projectData.forEach((row) => {
    const [no, detail, quantity, unit] = row;

    if (no === "ลำดับ" || no === "ลำดับที่") return;

    if (no && detail) {
      currentBuilding = detail;
      reportText += `\n${no}. ${currentBuilding}\n`;
      buildingIndex++;
      subItemIndex = 1;
    }

    if (currentBuilding && detail && !no) {
      const quantityText = quantity ? `จำนวน: ${quantity} ${unit}` : "จำนวน: ไม่ระบุ";

      if (
        detail.replace(/\s+/g, " ").toLowerCase().includes("รวมติดตั้ง access point") ||
        detail.replace(/\s+/g, " ").toLowerCase().includes("รวมติดตั้ง acess point")
      ) {
        const accessPoints = inventoryData.filter(
          ([, deviceType, , , , , , , location]) =>
            deviceType &&
            (deviceType.toLowerCase() === "accesspoint" ||
              deviceType.toLowerCase() === "access point") &&
            location &&
            location.includes(currentBuilding)
        );
        accessPoints.forEach(([, , brand, model, serialNumber, , deviceName, , location]) => {
          reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง Access Point ${brand} ${model} (${deviceName}) S/N: ${serialNumber} Location: ${location}\n`;
        });
      } else if (detail.toLowerCase().includes("switch")) {
        const normalize = (str) => (str ? str.toLowerCase().replace(/[\s\-]/g, "") : "");
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
        const matchedSwitch = Switches.find(([, , , model]) => {
          const d = normalize(detail);
          const m = normalize(model);
          return d.includes(m) || m.includes(d);
        });
        if (matchedSwitch) {
          const [, deviceType, brand, model, serialNumber, , deviceName, , location] = matchedSwitch;
          if (deviceType.toLowerCase() === "switch poe") {
            reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง Switch POE ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
          } else if (deviceType.toLowerCase() === "switch sfp") {
            reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง Switch SFP ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
          } else {
            reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง Switch ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
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
        const matchedRouter = Router.find(([, , , model]) => detail.includes(model));
        if (matchedRouter) {
          const [, , brand, model, serialNumber, , deviceName, , location] = matchedRouter;
          reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง Router ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
        }
      } else if (detail.toLowerCase().includes("ups")) {
        const ups = inventoryData.filter(
          ([, deviceType, , , , , , , location]) =>
            deviceType &&
            deviceType.toLowerCase() === "ups" &&
            location &&
            location.includes(currentBuilding)
        );
        const matchedUps = ups.filter(([, , , model]) =>
          detail?.toLowerCase().includes(model?.toLowerCase() || "")
        );
        matchedUps.forEach(([, , brand, model, serialNumber, , deviceName, , location]) => {
          reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง UPS ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
        });
      } else if (detail.toLowerCase().includes("wall") && detail.toLowerCase().includes("rack")) {
        reportText += `${buildingIndex - 1}.${subItemIndex} ติดตั้ง${detail} ${quantityText}\n`;
      } else if (
        (() => {
          const d = detail.toLowerCase();
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
        })()
      ) {
        return;
      } else {
        reportText += `${buildingIndex - 1}.${subItemIndex} ${detail} ${quantityText}\n`;
      }

      if (
        quantity > 1 &&
        (detail.includes("รวมติดตั้ง") || detail.includes("Outlet LAN") || detail.includes("Outlet"))
      ) {
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
          accessPoints.forEach(([, , brand, model, serialNumber, , deviceName, , location], index) => {
            reportText += `${buildingIndex - 1}.${subItemIndex}.${index + 1} ติดตั้ง Access Point ${brand} ${model} (${deviceName}) S/N: ${serialNumber} ${location}\n`;
          });
        } else if (detail.includes("Outlet LAN") || detail.includes("Outlet")) {
          for (let i = 1; i <= quantity; i++) {
            reportText += `${buildingIndex - 1}.${subItemIndex}.${i} Outlet LAN \n`;
          }
        } else {
          for (let i = 1; i <= quantity; i++) {
            reportText += `${buildingIndex - 1}.${subItemIndex}.${i} ${detail}\n`;
          }
        }
      }

      subItemIndex++;
    }
  });

  return reportText;
}
