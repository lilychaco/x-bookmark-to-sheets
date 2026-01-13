// =====================================
// CORS（プリフライト）対応
// =====================================
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(
    ContentService.MimeType.TEXT
  );
}

// =====================================
// WebApp メイン（POST受信）
// =====================================
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Invalid request data");
    }

    const data = JSON.parse(e.postData.contents);

    // 設定読み込み
    const { spreadsheetId, sheetName } = getSpreadsheetConfig();

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName(sheetName);

    // 保存先シートが無ければ作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      sheet
        .getRange(1, 1, 1, 6)
        .setValues([
          ["日時", "ユーザー名", "ツイート内容", "URL", "文字数", "保存時刻"],
        ]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }

    // 重複チェック（URL）
    const url = (data.url || "").trim();
    if (url && isDuplicateUrl(sheet, url)) {
      return jsonResponse({
        success: true,
        skipped: true,
        reason: "duplicate",
        message: "同じURLが既に保存されています",
      });
    }

    // データ保存
    const now = new Date();
    const tweetTime = data.time ? new Date(data.time) : now;
    const charCount = data.text ? data.text.length : 0;

    sheet.appendRow([
      tweetTime,
      data.username || "",
      data.text || "",
      url,
      charCount,
      now,
    ]);

    return jsonResponse({
      success: true,
      message: "保存しました",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || String(error),
    });
  }
}

// =====================================
// 設定シート読み込み（★最重要）
// =====================================
function getSpreadsheetConfig() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName("設定");

  if (!sheet) {
    throw new Error("設定シート「設定」が見つかりません");
  }

  const header = sheet.getRange("A1").getValue();
  if (header !== "設定") {
    throw new Error("設定シートのA1は「設定」にしてください");
  }

  const spreadsheetId = sheet.getRange("B2").getValue();
  const sheetName = sheet.getRange("B3").getValue();

  if (!spreadsheetId || !sheetName) {
    throw new Error("設定シートのB2/B3が未入力です");
  }

  return { spreadsheetId, sheetName };
}

// =====================================
// URL重複チェック（D列）
// =====================================
function isDuplicateUrl(sheet, url) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const values = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  return values.some((row) => String(row[0]).trim() === url);
}

// =====================================
// JSONレスポンス統一
// =====================================
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// =====================================
// テスト用（GAS単体）
// =====================================
function testFunction() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        username: "@test_user",
        text: "これはテスト投稿です",
        url: "https://x.com/test/status/123",
        time: new Date().toISOString(),
      }),
    },
  };

  const res = doPost(mockEvent);
  Logger.log(res.getContent());
}
