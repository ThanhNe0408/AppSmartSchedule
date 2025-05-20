// utils/scheduleParser.ts

export interface RecognizedEvent {
  id: string
  title: string
  date: Date
  startTime: string
  endTime: string
  location?: string
  description?: string
}

export const parseScheduleFromText = (text: string): RecognizedEvent[] => {
  const events: RecognizedEvent[] = []

  if (!text || text.trim() === "") {
    return []
  }

  console.log("Parsing text:", text)

  try {
    // First try to parse emoji-formatted schedule (like in the example)
    const emojiPattern =
      /📌\s*Thứ\s+(\d+)\s*$$(\d{1,2})\/(\d{1,2})\/(\d{4})$$[^]*?⏰\s*Tiết\s+(\d+)\s*-\s*(\d+)\s*$$([^)]+)$$[^]*?📘\s*([^-\n]+)(?:\s*-\s*Mã học phần:\s*([^\n]+))?[^]*?(?:👨‍🏫|👩‍🏫)\s*Giảng viên:\s*([^\n]+)[^]*?🏫\s*Phòng:\s*([^\n]+)/gi

    let emojiMatch
    while ((emojiMatch = emojiPattern.exec(text)) !== null) {
      const weekday = Number.parseInt(emojiMatch[1])
      const day = Number.parseInt(emojiMatch[2])
      const month = Number.parseInt(emojiMatch[3]) - 1 // JavaScript months are 0-indexed
      const year = Number.parseInt(emojiMatch[4])
      const startPeriod = Number.parseInt(emojiMatch[5])
      const endPeriod = Number.parseInt(emojiMatch[6])
      const timeRange = emojiMatch[7].trim()
      const title = emojiMatch[8].trim()
      const courseCode = emojiMatch[9] ? emojiMatch[9].trim() : ""
      const instructor = emojiMatch[10] ? emojiMatch[10].trim() : ""
      const room = emojiMatch[11] ? emojiMatch[11].trim() : ""

      // Extract start and end times from the time range
      const timeRangePattern = /(\d{1,2})[h:](\d{1,2})?\s*-\s*(\d{1,2})[h:](\d{1,2})?/
      const timeRangeMatch = timeRange.match(timeRangePattern)

      let startTime = ""
      let endTime = ""

      if (timeRangeMatch) {
        const startHour = timeRangeMatch[1].padStart(2, "0")
        const startMinute = (timeRangeMatch[2] || "00").padStart(2, "0")
        const endHour = timeRangeMatch[3].padStart(2, "0")
        const endMinute = (timeRangeMatch[4] || "00").padStart(2, "0")

        startTime = `${startHour}:${startMinute}`
        endTime = `${endHour}:${endMinute}`
      } else {
        // If time range not found, use period mapping
        const periodToTime = {
          1: "07:00",
          2: "08:00",
          3: "09:10",
          4: "10:10",
          5: "11:10",
          6: "13:00",
          7: "14:00",
          8: "15:00",
          9: "16:00",
          10: "17:00",
          11: "18:00",
          12: "19:00",
          13: "20:00",
        }

        const periodEndTime = {
          1: "07:50",
          2: "08:50",
          3: "10:00",
          4: "11:00",
          5: "12:00",
          6: "13:50",
          7: "14:50",
          8: "15:50",
          9: "16:50",
          10: "17:50",
          11: "18:50",
          12: "19:50",
          13: "20:50",
        }

        startTime = periodToTime[startPeriod as keyof typeof periodToTime] || `${startPeriod}:00`
        endTime = periodEndTime[endPeriod as keyof typeof periodEndTime] || `${endPeriod + 1}:00`
      }

      const date = new Date(year, month, day)

      events.push({
        id: events.length.toString(),
        title,
        date,
        startTime,
        endTime,
        location: room,
        description: `Mã học phần: ${courseCode}, GV: ${instructor}, Thứ ${weekday}, Tiết ${startPeriod}-${endPeriod}`,
      })
    }

    // If no events found with emoji pattern, try TDMU table format
    if (events.length === 0) {
      // Extract week information
      const weekPattern =
        /Tuần\s+(\d+)\s*\[từ\s+ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+đến\s+ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\]/i
      const weekMatch = text.match(weekPattern)

      let weekStartDate = new Date()
      if (weekMatch) {
        weekStartDate = new Date(
          Number.parseInt(weekMatch[4]), // year
          Number.parseInt(weekMatch[3]) - 1, // month (0-indexed)
          Number.parseInt(weekMatch[2]), // day
        )
      }

      // Pattern for TDMU table format
      const classPattern =
        /(Phát triển ứng dụng|Thực hành|Đồ án|[A-Za-zÀ-ỹ\s]+)\s*(?:$$(\d+)\+(\d+)$$)?\s*(?:$$([A-Z0-9]+)$$)?\s*Nhóm:\s*([A-Z0-9.]+)\s*Phòng:\s*([A-Z0-9-]+)\s*GV:\s*([A-Za-zÀ-ỹ\s]+)/gi

      let match
      while ((match = classPattern.exec(text)) !== null) {
        // Find the day and period information
        const surroundingText = text.substring(
          Math.max(0, match.index - 500),
          Math.min(text.length, match.index + match[0].length + 500),
        )

        // Extract weekday
        const weekdayPattern = /Thứ\s+(\d+)/i
        const weekdayMatch = surroundingText.match(weekdayPattern)
        const weekday = weekdayMatch ? Number.parseInt(weekdayMatch[1]) : 2

        // Extract period
        const periodPattern = /Tiết\s+(\d+)(?:\s*-\s*Tiết\s+(\d+)|(?:\s*-\s*|\s+)(\d+))?/i
        const periodMatch = surroundingText.match(periodPattern)

        let startPeriod = 1
        let endPeriod = 1

        if (periodMatch) {
          startPeriod = Number.parseInt(periodMatch[1])
          endPeriod = periodMatch[2]
            ? Number.parseInt(periodMatch[2])
            : periodMatch[3]
              ? Number.parseInt(periodMatch[3])
              : startPeriod
        }

        // Map periods to actual times
        const periodToTime = {
          1: "07:00",
          2: "08:00",
          3: "09:10",
          4: "10:10",
          5: "11:10",
          6: "13:00",
          7: "14:00",
          8: "15:00",
          9: "16:00",
          10: "17:00",
          11: "18:00",
          12: "19:00",
          13: "20:00",
        }

        const periodEndTime = {
          1: "07:50",
          2: "08:50",
          3: "10:00",
          4: "11:00",
          5: "12:00",
          6: "13:50",
          7: "14:50",
          8: "15:50",
          9: "16:50",
          10: "17:50",
          11: "18:50",
          12: "19:50",
          13: "20:50",
        }

        const startTime = periodToTime[startPeriod as keyof typeof periodToTime] || `${startPeriod}:00`
        const endTime = periodEndTime[endPeriod as keyof typeof periodEndTime] || `${endPeriod + 1}:00`

        // Calculate date based on weekday
        const date = new Date(weekStartDate)
        const dayOffset = (weekday === 8 ? 0 : weekday - 1) - weekStartDate.getDay()
        date.setDate(date.getDate() + (dayOffset >= 0 ? dayOffset : dayOffset + 7))

        const title = match[1]?.trim() || "Không xác định"
        const theoryCredits = match[2] || "0"
        const practiceCredits = match[3] || "0"
        const courseCode = match[4] || ""
        const group = match[5]?.trim() || ""
        const room = match[6]?.trim() || ""
        const instructor = match[7]?.trim() || ""

        events.push({
          id: events.length.toString(),
          title: `${title} (${theoryCredits}+${practiceCredits})${courseCode ? ` - ${courseCode}` : ""}`,
          date,
          startTime,
          endTime,
          location: room,
          description: `Nhóm: ${group}, GV: ${instructor}, Thứ ${weekday}, Tiết ${startPeriod}-${endPeriod}`,
        })
      }
    }

    // If still no events found, try a more general approach for TDMU table
    if (events.length === 0) {
      const generalPattern =
        /Thứ\s+(\d+)[\s\S]{1,50}?Tiết\s+(\d+)(?:\s*-\s*|\s+)(\d+)?[\s\S]{1,500}?([A-Za-zÀ-ỹ\s]+)(?:$$(\d+)\+(\d+)$$)?(?:$$([A-Z0-9]+)$$)?[\s\S]{1,100}?Nhóm:[\s\S]{1,50}?([A-Za-zÀ-ỹ\s.]+)[\s\S]{1,50}?Phòng:[\s\S]{1,50}?([A-Za-zÀ-ỹ0-9\s.-]+)[\s\S]{1,50}?GV:[\s\S]{1,50}?([A-Za-zÀ-ỹ\s]+)/gi

      // Extract week information first
      const weekPattern =
        /Tuần\s+(\d+)\s*\[từ\s+ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+đến\s+ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\]/i
      const weekMatch = text.match(weekPattern)

      let weekStartDate = new Date()
      if (weekMatch) {
        weekStartDate = new Date(
          Number.parseInt(weekMatch[4]), // year
          Number.parseInt(weekMatch[3]) - 1, // month (0-indexed)
          Number.parseInt(weekMatch[2]), // day
        )
      }

      let blockMatch
      while ((blockMatch = generalPattern.exec(text)) !== null) {
        const weekday = Number.parseInt(blockMatch[1]?.trim() || "2")
        const startPeriod = Number.parseInt(blockMatch[2]?.trim() || "1")
        const endPeriod = blockMatch[3] ? Number.parseInt(blockMatch[3].trim()) : startPeriod + 2
        const title = blockMatch[4]?.trim() || "Không xác định"
        const theoryCredits = blockMatch[5] || "0"
        const practiceCredits = blockMatch[6] || "0"
        const courseCode = blockMatch[7] || ""
        const group = blockMatch[8]?.trim() || ""
        const room = blockMatch[9]?.trim() || ""
        const instructor = blockMatch[10]?.trim() || ""

        // Calculate date based on weekday
        const date = new Date(weekStartDate)
        const dayOffset = (weekday === 8 ? 0 : weekday - 1) - weekStartDate.getDay()
        date.setDate(date.getDate() + (dayOffset >= 0 ? dayOffset : dayOffset + 7))

        // Map periods to actual times
        const periodToTime = {
          1: "07:00",
          2: "08:00",
          3: "09:10",
          4: "10:10",
          5: "11:10",
          6: "13:00",
          7: "14:00",
          8: "15:00",
          9: "16:00",
          10: "17:00",
          11: "18:00",
          12: "19:00",
          13: "20:00",
        }

        const periodEndTime = {
          1: "07:50",
          2: "08:50",
          3: "10:00",
          4: "11:00",
          5: "12:00",
          6: "13:50",
          7: "14:50",
          8: "15:50",
          9: "16:50",
          10: "17:50",
          11: "18:50",
          12: "19:50",
          13: "20:50",
        }

        const startTime = periodToTime[startPeriod as keyof typeof periodToTime] || `${startPeriod}:00`
        const endTime = periodEndTime[endPeriod as keyof typeof periodEndTime] || `${endPeriod}:50`

        const fullTitle =
          theoryCredits && practiceCredits
            ? `${title} (${theoryCredits}+${practiceCredits})${courseCode ? ` - ${courseCode}` : ""}`
            : title

        events.push({
          id: events.length.toString(),
          title: fullTitle,
          date,
          startTime,
          endTime,
          location: room,
          description: `Nhóm: ${group}, GV: ${instructor}, Thứ ${weekday}, Tiết ${startPeriod}-${endPeriod}`,
        })
      }
    }
  } catch (error) {
    console.error("Error parsing schedule:", error)
  }

  return events
}
