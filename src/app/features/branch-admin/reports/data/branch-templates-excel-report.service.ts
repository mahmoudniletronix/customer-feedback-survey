import { Injectable } from '@angular/core';
import { BranchTemplatesReportPreview } from '../domain/branch-templates-pdf-report.model';

type ExcelCellValue = string | number | boolean | null;
type ExcelRow = Record<string, ExcelCellValue>;
type ExcelLanguage = 'ar' | 'en';
type ReportSectionKey =
  | 'reportInfo'
  | 'executiveSummary'
  | 'templatesSummary'
  | 'questionsAnalytics'
  | 'worstQuestions'
  | 'bestQuestions'
  | 'templateDetails';

interface ExcelWorksheet {
  readonly title: string;
  readonly rows: readonly ExcelRow[];
  readonly language: ExcelLanguage;
}

interface ReportSection {
  readonly title: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

interface NormalizeContext {
  readonly sectionTitle: string;
  readonly language: ExcelLanguage;
  readonly depth: number;
  readonly parentContext: ExcelRow;
  readonly childRowsByTitle: Map<string, ExcelRow[]>;
}

@Injectable()
export class BranchTemplatesExcelReportService {
  private readonly excelMimeType = 'application/vnd.ms-excel;charset=utf-8';
  private readonly maxNestedSheetDepth = 3;
  private readonly maxCellTextLength = 32000;
  private readonly emptyValue = '';

  toBlob(report: BranchTemplatesReportPreview): Blob {
    const workbookXml = this.toWorkbookXml(report);
    return new Blob(['\ufeff', workbookXml], { type: this.excelMimeType });
  }

  private toWorkbookXml(report: BranchTemplatesReportPreview): string {
    const language = this.toLanguage(report);
    const sections = this.reportSections(report, language).flatMap((section) =>
      this.toWorksheets(section, language),
    );

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?mso-application progid="Excel.Sheet"?>',
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
      ' xmlns:o="urn:schemas-microsoft-com:office:office"',
      ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"',
      ' xmlns:html="http://www.w3.org/TR/REC-html40">',
      '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">',
      `<Author>${this.escapeXml(report.generatedBy || 'Customer Feedback Survey')}</Author>`,
      `<Created>${this.escapeXml(report.generatedAtUtc)}</Created>`,
      '</DocumentProperties>',
      this.stylesXml(),
      this.singleWorksheetXml(sections, language),
      '</Workbook>',
    ].join('');
  }

  private reportSections(
    report: BranchTemplatesReportPreview,
    language: ExcelLanguage,
  ): readonly ReportSection[] {
    return [
      { title: this.sectionTitle('reportInfo', language), rows: this.reportMetadataRows(report, language) },
      { title: this.sectionTitle('executiveSummary', language), rows: [report.executiveSummary] },
      { title: this.sectionTitle('templatesSummary', language), rows: report.templates },
      { title: this.sectionTitle('questionsAnalytics', language), rows: report.questions },
      { title: this.sectionTitle('worstQuestions', language), rows: report.worstQuestions },
      { title: this.sectionTitle('bestQuestions', language), rows: report.bestQuestions },
      { title: this.sectionTitle('templateDetails', language), rows: report.templateDetails },
    ];
  }

  private reportMetadataRows(
    report: BranchTemplatesReportPreview,
    language: ExcelLanguage,
  ): readonly ExcelRow[] {
    const metadata: Readonly<Record<string, ExcelCellValue>> = {
      language: report.language,
      direction: report.direction,
      branchName: report.branchName,
      generatedBy: report.generatedBy,
      generatedAtUtc: report.generatedAtUtc,
      fromDate: report.fromDate,
      toDate: report.toDate,
      selectedTemplateId: report.selectedTemplateId,
      selectedTemplateKind: report.selectedTemplateKind,
      selectedTemplateName: report.selectedTemplateName,
      scoreCalculationMode: report.scoreCalculationMode,
      topWorstQuestionsCount: report.topWorstQuestionsCount,
      worstQuestionsScoreRange: `0% - ${report.worstQuestionsMaxScorePercentage}%`,
      bestQuestionsScoreRange: `${report.bestQuestionsMinScorePercentage}% - 100%`,
    };

    return Object.keys(metadata).map((key) => ({
      field: this.columnLabel(key, language),
      value: metadata[key],
    }));
  }

  private toWorksheets(section: ReportSection, language: ExcelLanguage): readonly ExcelWorksheet[] {
    const childRowsByTitle = new Map<string, ExcelRow[]>();
    const mainRows = section.rows.map((row, index) =>
      this.flattenRecord(row, {
        sectionTitle: section.title,
        language,
        depth: 0,
        parentContext: this.parentContext(row, index, language),
        childRowsByTitle,
      }),
    );
    const childSheets = [...childRowsByTitle.entries()].map(([title, rows]) => ({
      title,
      rows,
      language,
    }));

    return [{ title: section.title, rows: mainRows, language }, ...childSheets];
  }

  private flattenRecord(record: Readonly<Record<string, unknown>>, context: NormalizeContext): ExcelRow {
    const flattened: ExcelRow = {};

    Object.keys(record).forEach((key) => {
      this.writeValue(flattened, key, record[key], context);
    });

    return this.mergeLocalizedTextColumns(flattened, context.language);
  }

  private writeValue(
    target: ExcelRow,
    key: string,
    value: unknown,
    context: NormalizeContext,
  ): void {
    if (this.isScalarValue(value)) {
      target[key] = this.toCellValue(value);
      return;
    }

    if (value instanceof Date) {
      target[key] = value.toISOString();
      return;
    }

    if (Array.isArray(value)) {
      this.writeArrayValue(target, key, value, context);
      return;
    }

    if (this.isRecord(value)) {
      Object.keys(value).forEach((nestedKey) => {
        this.writeValue(target, `${key}.${nestedKey}`, value[nestedKey], context);
      });
      return;
    }

    target[key] = this.emptyValue;
  }

  private writeArrayValue(
    target: ExcelRow,
    key: string,
    value: readonly unknown[],
    context: NormalizeContext,
  ): void {
    if (value.length === 0) {
      target[key] = this.emptyValue;
      return;
    }

    const records = value.filter((item): item is Readonly<Record<string, unknown>> =>
      this.isRecord(item),
    );
    if (records.length === value.length && context.depth < this.maxNestedSheetDepth) {
      const childTitle = this.childSectionTitle(context.sectionTitle, key, context.language);
      target[`${key}Count`] = value.length;
      this.appendChildRows(childTitle, records, context);
      return;
    }

    target[key] = this.formatReadableValue(value, context.language);
  }

  private appendChildRows(
    title: string,
    records: readonly Readonly<Record<string, unknown>>[],
    context: NormalizeContext,
  ): void {
    const rows = context.childRowsByTitle.get(title) ?? [];
    records.forEach((record, index) => {
      const childParentContext: ExcelRow = {
        ...context.parentContext,
        parentSection: context.sectionTitle,
        itemNumber: index + 1,
      };
      const childRow: ExcelRow = {
        ...childParentContext,
        ...this.flattenRecord(record, {
          sectionTitle: title,
          language: context.language,
          depth: context.depth + 1,
          parentContext: childParentContext,
          childRowsByTitle: context.childRowsByTitle,
        }),
      };
      rows.push(childRow);
    });
    context.childRowsByTitle.set(title, rows);
  }

  private parentContext(
    record: Readonly<Record<string, unknown>>,
    index: number,
    language: ExcelLanguage,
  ): ExcelRow {
    const context: ExcelRow = {
      parentRow: index + 1,
    };
    const preferredKeys = [
      'templateName',
      'templateNameEn',
      'templateNameAr',
      'selectedTemplateName',
      'questionText',
      'questionTextEn',
      'questionTextAr',
      'nameEn',
      'nameAr',
      'templateId',
      'templateKind',
      'questionId',
      'id',
    ];

    preferredKeys.forEach((key) => {
      const value = record[key];
      if (this.isScalarValue(value)) {
        context[`parent.${key}`] = this.toCellValue(value);
      }
    });

    const summary = record['summary'];
    if (this.isRecord(summary)) {
      preferredKeys.forEach((key) => {
        const value = summary[key];
        if (this.isScalarValue(value) && !this.hasCellValue(context[`parent.${key}`])) {
          context[`parent.${key}`] = this.toCellValue(value);
        }
      });
    }

    return this.mergeLocalizedTextColumns(context, language);
  }

  private singleWorksheetXml(sections: readonly ExcelWorksheet[], language: ExcelLanguage): string {
    const normalizedSections = sections.map((section) => ({
      ...section,
      rows: section.rows.length > 0 ? section.rows : [{ message: this.noDataLabel(language) }],
    }));
    const maxColumnCount = this.maxColumnCount(normalizedSections);
    const expandedRowCount = normalizedSections.reduce(
      (count, section) => count + section.rows.length + 3,
      0,
    );
    const worksheetName = this.workbookTitle(language);

    return [
      `<Worksheet ss:Name="${this.escapeXml(worksheetName)}">`,
      `<Table ss:ExpandedColumnCount="${maxColumnCount}" ss:ExpandedRowCount="${expandedRowCount}" x:FullColumns="1" x:FullRows="1">`,
      this.workbookColumnsXml(normalizedSections, maxColumnCount, language),
      normalizedSections.map((section) => this.sectionRowsXml(section, maxColumnCount)).join(''),
      '</Table>',
      this.worksheetOptionsXml(),
      '</Worksheet>',
    ].join('');
  }

  private sectionRowsXml(section: ExcelWorksheet, maxColumnCount: number): string {
    const columns = this.columnsForRows(section.rows);
    const mergeAcross = maxColumnCount > 1 ? ` ss:MergeAcross="${maxColumnCount - 1}"` : '';
    const titleRow = `<Row ss:Height="26"><Cell ss:StyleID="Section"${mergeAcross}><Data ss:Type="String">${this.escapeXml(section.title)}</Data></Cell></Row>`;
    const headerRow = `<Row ss:Height="22">${columns
      .map(
        (column) =>
          `<Cell ss:StyleID="Header"><Data ss:Type="String">${this.escapeXml(
            this.columnLabel(column, section.language),
          )}</Data></Cell>`,
      )
      .join('')}</Row>`;
    const bodyRows = section.rows.map((row) => this.rowXml(row, columns)).join('');

    return `${titleRow}${headerRow}${bodyRows}<Row ss:Height="10"/>`;
  }

  private rowXml(row: ExcelRow, columns: readonly string[]): string {
    const cells = columns.map((column) => this.cellXml(row[column])).join('');
    return `<Row ss:AutoFitHeight="1">${cells}</Row>`;
  }

  private cellXml(value: ExcelCellValue | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '<Cell ss:StyleID="Data"><Data ss:Type="String"></Data></Cell>';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return `<Cell ss:StyleID="Number"><Data ss:Type="Number">${value}</Data></Cell>`;
    }

    if (typeof value === 'boolean') {
      return `<Cell ss:StyleID="Data"><Data ss:Type="Boolean">${value ? 1 : 0}</Data></Cell>`;
    }

    return `<Cell ss:StyleID="Data"><Data ss:Type="String">${this.escapeXml(
      this.limitCellText(String(value)),
    )}</Data></Cell>`;
  }

  private columnsForRows(rows: readonly ExcelRow[]): readonly string[] {
    const columns = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => columns.add(key));
    });

    return columns.size > 0 ? [...columns] : ['message'];
  }

  private workbookColumnsXml(
    sections: readonly ExcelWorksheet[],
    maxColumnCount: number,
    language: ExcelLanguage,
  ): string {
    return Array.from({ length: maxColumnCount }, (_, columnIndex) => {
      const width = this.workbookColumnWidth(sections, columnIndex, language);
      return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
    }).join('');
  }

  private maxColumnCount(sections: readonly ExcelWorksheet[]): number {
    return Math.max(...sections.map((section) => this.columnsForRows(section.rows).length), 1);
  }

  private workbookColumnWidth(
    sections: readonly ExcelWorksheet[],
    columnIndex: number,
    language: ExcelLanguage,
  ): number {
    const samples = sections.flatMap<string>((section) => {
      const columns = this.columnsForRows(section.rows);
      const column = columns[columnIndex];
      if (!column) {
        return [];
      }

      return [
        this.columnLabel(column, section.language),
        ...section.rows
          .map((row) => row[column])
          .filter((value) => value !== null && value !== undefined)
          .map((value) => String(value)),
      ];
    });
    const sampleLength = samples.reduce((maxLength, sample) => {
      const text = String(sample);
      const longestLineLength = text
        .split(/\r?\n/)
        .reduce((lineMax, line) => Math.max(lineMax, line.length), 0);
      return Math.max(maxLength, longestLineLength);
    }, 0);
    const longTextColumn = sections.some((section) => {
      const column = this.columnsForRows(section.rows)[columnIndex];
      return column ? this.isLongTextColumn(column) : false;
    });

    if (longTextColumn) {
      return 340;
    }

    return Math.min(Math.max(sampleLength * 7 + 28, 90), language === 'ar' ? 280 : 260);
  }

  private isLongTextColumn(column: string): boolean {
    const normalized = column.toLowerCase();
    return [
      'answer',
      'comment',
      'condition',
      'description',
      'detail',
      'feedback',
      'note',
      'option',
      'question',
      'text',
    ].some((keyword) => normalized.includes(keyword));
  }

  private worksheetOptionsXml(): string {
    return [
      '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">',
      '<FreezePanes/>',
      '<FrozenNoSplit/>',
      '<SplitHorizontal>1</SplitHorizontal>',
      '<TopRowBottomPane>1</TopRowBottomPane>',
      '<ActivePane>2</ActivePane>',
      '</WorksheetOptions>',
    ].join('');
  }

  private stylesXml(): string {
    return [
      '<Styles>',
      '<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Segoe UI" ss:Size="10"/></Style>',
      '<Style ss:ID="Section"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Segoe UI" ss:Bold="1" ss:Size="12" ss:Color="#0F172A"/><Interior ss:Color="#DDEBFA" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9FBAD3"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#9FBAD3"/></Borders></Style>',
      '<Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Segoe UI" ss:Bold="1" ss:Size="10" ss:Color="#0F172A"/><Interior ss:Color="#EAF5FF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#BFD3E6"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2EC"/></Borders></Style>',
      '<Style ss:ID="Data"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Segoe UI" ss:Size="10"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>',
      '<Style ss:ID="Number"><Alignment ss:Horizontal="Center" ss:Vertical="Top"/><Font ss:FontName="Segoe UI" ss:Size="10"/><NumberFormat ss:Format="General"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>',
      '</Styles>',
    ].join('');
  }

  private sectionTitle(section: ReportSectionKey, language: ExcelLanguage): string {
    return this.sectionTitles()[section][language];
  }

  private sectionTitles(): Readonly<Record<ReportSectionKey, Readonly<Record<ExcelLanguage, string>>>> {
    return {
      reportInfo: { en: 'Report Info', ar: 'معلومات التقرير' },
      executiveSummary: { en: 'Executive Summary', ar: 'الملخص التنفيذي' },
      templatesSummary: { en: 'Templates Summary', ar: 'ملخص النماذج' },
      questionsAnalytics: { en: 'Questions Analytics', ar: 'تحليلات الأسئلة' },
      worstQuestions: { en: 'Lowest-rated Questions', ar: 'الأسئلة الأقل تقييمًا' },
      bestQuestions: { en: 'Best Questions', ar: 'أفضل الأسئلة' },
      templateDetails: { en: 'Template Details', ar: 'تفاصيل النماذج' },
    };
  }

  private noDataLabel(language: ExcelLanguage): string {
    return language === 'ar' ? 'لا توجد بيانات' : 'No data';
  }

  private workbookTitle(language: ExcelLanguage): string {
    return language === 'ar' ? 'تقرير النماذج' : 'Templates Report';
  }

  private columnLabel(column: string, language: ExcelLanguage): string {
    const englishOverrides: Readonly<Record<string, string>> = {
      field: 'Field',
      value: 'Value',
      message: 'Message',
      parentRow: 'Parent Row',
      parentSection: 'Parent Section',
      itemNumber: 'Item Number',
      language: 'Language',
      direction: 'Direction',
      generatedAtUtc: 'Generated At',
      fromDate: 'From Date',
      toDate: 'To Date',
      branchName: 'Branch Name',
      generatedBy: 'Generated By',
      selectedTemplateId: 'Selected Template Id',
      templateName: 'Template Name',
      selectedTemplateName: 'Selected Template',
      selectedTemplateKind: 'Selected Template Type',
      scoreCalculationMode: 'Score Calculation',
      topWorstQuestionsCount: 'Lowest-rated Questions Count',
      worstQuestionsScoreRange: 'Lowest-rated Questions Score Range',
      bestQuestionsScoreRange: 'Best Questions Score Range',
      questionText: 'Question',
      questionType: 'Question Type',
      totalAnswers: 'Total Answers',
      averageScoreValue: 'Average Score',
      satisfactionPercentage: 'Satisfaction %',
      name: 'Name',
      status: 'Status',
      activeFrom: 'Active From',
      expireTo: 'Expire To',
      totalQuestions: 'Total Questions',
      rootQuestions: 'Root Questions',
      conditionalQuestions: 'Conditional Questions',
      optionsCount: 'Options Count',
      questionsCount: 'Questions Count',
      flowLinesCount: 'Flow Lines Count',
      parent: 'Parent',
      summary: 'Summary',
    };
    const arabicOverrides: Readonly<Record<string, string>> = {
      field: 'الحقل',
      value: 'القيمة',
      message: 'الرسالة',
      parentRow: 'صف الأصل',
      parentSection: 'قسم الأصل',
      itemNumber: 'رقم العنصر',
      language: 'اللغة',
      direction: 'الاتجاه',
      generatedAtUtc: 'وقت الإنشاء',
      fromDate: 'من تاريخ',
      toDate: 'إلى تاريخ',
      branchName: 'اسم الفرع',
      generatedBy: 'تم الإنشاء بواسطة',
      selectedTemplateId: 'معرف النموذج المحدد',
      selectedTemplateKind: 'نوع النموذج المحدد',
      selectedTemplateName: 'النموذج المحدد',
      scoreCalculationMode: 'طريقة حساب التقييم',
      topWorstQuestionsCount: 'عدد الأسئلة الأقل تقييمًا',
      worstQuestionsScoreRange: 'نطاق تقييم الأسئلة الأقل تقييمًا',
      bestQuestionsScoreRange: 'نطاق تقييم أفضل الأسئلة',
      rank: 'الترتيب',
      templateId: 'معرف النموذج',
      templateKind: 'نوع النموذج',
      templateName: 'اسم النموذج',
      templateQuestionId: 'معرف سؤال النموذج',
      questionId: 'معرف السؤال',
      questionText: 'السؤال',
      questionType: 'نوع السؤال',
      isRootQuestion: 'سؤال رئيسي',
      parentTriggerText: 'إجابة السؤال الأصل',
      totalAnswers: 'إجمالي الإجابات',
      skippedCount: 'عدد المتخطين',
      averageValue: 'متوسط القيمة',
      scoreAverageValue: 'متوسط التقييم',
      scoreAveragePercentage: 'نسبة متوسط التقييم',
      averageScoreValue: 'متوسط التقييم',
      averageScore: 'متوسط التقييم',
      averageScorePercentage: 'نسبة متوسط التقييم',
      satisfactionPercentage: 'نسبة الرضا',
      isScoreIncluded: 'يدخل في التقييم',
      optionsCount: 'عدد الاختيارات',
      options: 'الاختيارات',
      name: 'الاسم',
      status: 'الحالة',
      activeFrom: 'بداية التفعيل',
      expireTo: 'تاريخ الانتهاء',
      totalQuestions: 'إجمالي الأسئلة',
      rootQuestions: 'الأسئلة الرئيسية',
      conditionalQuestions: 'الأسئلة الشرطية',
      totalResponses: 'إجمالي الردود',
      totalNormalTemplates: 'إجمالي النماذج العادية',
      totalAnonymousTemplates: 'إجمالي النماذج المجهولة',
      totalTemplates: 'إجمالي النماذج',
      totalNormalResponses: 'ردود النماذج العادية',
      totalAnonymousResponses: 'ردود النماذج المجهولة',
      totalScoredAnswers: 'الإجابات المحتسبة في التقييم',
      totalNonScoredAnswers: 'الإجابات غير المحتسبة في التقييم',
      highestRatedTemplateName: 'أعلى نموذج تقييمًا',
      lowestRatedTemplateName: 'أقل نموذج تقييمًا',
      mostAnsweredTemplateName: 'أكثر نموذج حصولًا على ردود',
      templatesWithoutResponses: 'نماذج بدون ردود',
      questionsCount: 'عدد الأسئلة',
      flowLinesCount: 'عدد مسارات الأسئلة',
      parent: 'الأصل',
      summary: 'الملخص',
    };

    const overrides = language === 'ar' ? arabicOverrides : englishOverrides;
    const override = overrides[column];
    if (override) {
      return override;
    }

    if (column.includes('.')) {
      return column
        .split('.')
        .map((part) => this.columnLabel(part, language))
        .join(language === 'ar' ? ' - ' : ' ');
    }

    return this.readableColumnLabel(column);
  }

  private readableColumnLabel(column: string): string {
    return column
      .replaceAll('.', ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private childSectionTitle(sectionTitle: string, key: string, language: ExcelLanguage): string {
    return `${sectionTitle} ${this.columnLabel(key, language)}`;
  }

  private formatReadableValue(value: unknown, language: ExcelLanguage): string {
    if (this.isScalarValue(value)) {
      const cellValue = this.toCellValue(value);
      return cellValue === null ? this.emptyValue : String(cellValue);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value
        .map((item, index) => `${index + 1}. ${this.formatReadableValue(item, language)}`)
        .join('\n');
    }

    if (this.isRecord(value)) {
      return Object.keys(value)
        .map(
          (key) =>
            `${this.columnLabel(key, language)}: ${this.formatReadableValue(value[key], language)}`,
        )
        .join('\n');
    }

    return this.emptyValue;
  }

  private mergeLocalizedTextColumns(row: ExcelRow, language: ExcelLanguage): ExcelRow {
    const result: ExcelRow = {};
    const localizedBases = new Set<string>();
    const handledBases = new Set<string>();

    Object.keys(row).forEach((key) => {
      const baseKey = this.localizedBaseKey(key);
      if (baseKey) {
        localizedBases.add(baseKey);
      }
    });

    Object.keys(row).forEach((key) => {
      const baseKey = this.localizedBaseKey(key);
      if (baseKey) {
        if (!handledBases.has(baseKey)) {
          result[baseKey] = this.localizedCellValue(row, baseKey, language);
          handledBases.add(baseKey);
        }
        return;
      }

      if (localizedBases.has(key)) {
        if (!handledBases.has(key)) {
          result[key] = this.localizedCellValue(row, key, language);
          handledBases.add(key);
        }
        return;
      }

      result[key] = row[key];
    });

    return result;
  }

  private localizedBaseKey(key: string): string | null {
    const match = /^(.*)(En|Ar)$/.exec(key);
    if (!match || !match[1]) {
      return null;
    }

    return match[1];
  }

  private localizedCellValue(row: ExcelRow, baseKey: string, language: ExcelLanguage): ExcelCellValue {
    const preferredSuffix = language === 'ar' ? 'Ar' : 'En';
    const fallbackSuffix = language === 'ar' ? 'En' : 'Ar';
    const preferredValue = row[`${baseKey}${preferredSuffix}`];
    const fallbackValue = row[`${baseKey}${fallbackSuffix}`];
    const baseValue = row[baseKey];

    if (this.hasCellValue(preferredValue)) {
      return preferredValue;
    }
    if (this.hasCellValue(fallbackValue)) {
      return fallbackValue;
    }
    if (this.hasCellValue(baseValue)) {
      return baseValue;
    }

    return this.emptyValue;
  }

  private hasCellValue(value: ExcelCellValue | undefined): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    return typeof value !== 'string' || value.trim().length > 0;
  }

  private toCellValue(value: string | number | boolean | null | undefined): ExcelCellValue {
    if (value === null || value === undefined) {
      return this.emptyValue;
    }

    if (typeof value === 'string') {
      return this.limitCellText(value);
    }

    return value;
  }

  private toLanguage(report: BranchTemplatesReportPreview): ExcelLanguage {
    const language = report.language.toLowerCase();
    const direction = report.direction.toLowerCase();
    return language.startsWith('ar') || direction === 'rtl' ? 'ar' : 'en';
  }

  private limitCellText(value: string): string {
    const sanitizedValue = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
    if (sanitizedValue.length <= this.maxCellTextLength) {
      return sanitizedValue;
    }

    return `${sanitizedValue.slice(0, this.maxCellTextLength)}\n[Text shortened to fit Excel cell limits]`;
  }

  private isScalarValue(value: unknown): value is string | number | boolean | null | undefined {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }

  private isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private escapeXml(value: string): string {
    return this.limitCellText(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }
}
