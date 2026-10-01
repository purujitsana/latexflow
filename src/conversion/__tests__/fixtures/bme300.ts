// Verbatim fixture: a real-world academic LaTeX report template (BME 300
// final report), used as a stress test for the parser against hand-written
// LaTeX that packs section/subsection/table commands back-to-back with no
// blank lines, uses tabularx/longtable/booktabs, multicolumn, thebibliography,
// and a large custom preamble.
export const bme300Latex = `\\documentclass[12pt]{article}
\\usepackage[a4paper,margin=1in,headheight=16pt]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern,setspace,parskip,enumitem}
\\usepackage{tabularx,longtable,array,booktabs}
\\usepackage{amsmath,amssymb}
\\usepackage[table]{xcolor}
\\usepackage{titlesec,fancyhdr,graphicx}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,urlcolor=blue,linkcolor=black,citecolor=black,
    pdftitle={BME 300 Final Report Template},pdfauthor={},pdfsubject={Biomedical Engineering Design I}}
\\definecolor{accent}{HTML}{1F4E79}
\\definecolor{lightaccent}{HTML}{EAF1F7}
\\titleformat{\\section}{\\Large\\bfseries\\raggedright\\color{accent}}{\\thesection}{0.6em}{}
\\titleformat{\\subsection}{\\large\\bfseries\\raggedright\\color{accent}}{\\thesubsection}{0.6em}{}
\\titleformat{\\subsubsection}{\\normalsize\\bfseries}{\\thesubsubsection}{0.6em}{}
\\pagestyle{fancy}
\\fancyhf{}
\\lhead{BME 300 Final Report}
\\rhead{\\small Biomedical Engineering, BUET}
\\fancyfoot[C]{\\thepage}
\\setstretch{1.15}
\\setlength{\\parindent}{0pt}
\\setlength{\\emergencystretch}{2em}
\\setlist[itemize]{leftmargin=1.5em,itemsep=0.2em}
\\renewcommand{\\arraystretch}{1.3}
\\newcolumntype{Y}{>{\\raggedright\\arraybackslash}X}
\\newcolumntype{L}[1]{>{\\raggedright\\arraybackslash}p{#1}}
% Set to false after completing the report to hide guidance paragraphs.
\\newif\\ifshowguidance
\\showguidancetrue
\\newcommand{\\instructionbox}[1]{\\ifshowguidance\\par\\begingroup\\small
    \\textbf{Guidance.} #1\\par\\endgroup\\medskip\\fi}
\\newcommand{\\placeholder}[1]{\\textit{[#1]}}
\\newcommand{\\checkbox}{\\(\\square\\)}
\\begin{document}
\\hypersetup{pageanchor=false}
\\begin{titlepage}
\\centering
\\vspace*{1cm}
{\\Huge\\bfseries BME 300\\par}
\\vspace{0.4cm}
{\\LARGE Biomedical Engineering Design I\\par}
\\vspace{0.4cm}
{\\LARGE Final Report\\par}
\\vspace{1cm}
{\\Large\\bfseries\\placeholder{Project title}\\par}
\\vspace{1cm}
{\\large Department of Biomedical Engineering\\par}
{\\large Bangladesh University of Engineering and Technology\\par}
\\vspace{0.8cm}
\\begin{tabularx}{\\textwidth}{|L{0.30\\textwidth}|Y|}
\\hline
\\textbf{Section / Group} & \\placeholder{Section and group number} \\\\ \\hline
\\textbf{Session / Term} & \\placeholder{Academic session and term} \\\\ \\hline
\\textbf{Supervisor} & \\placeholder{Name and designation} \\\\ \\hline
\\textbf{Course Teacher} & \\placeholder{Name and designation} \\\\ \\hline
\\textbf{Submission Date} & \\placeholder{Day month year} \\\\ \\hline
\\end{tabularx}
\\vspace{0.5cm}
\\begin{tabularx}{\\textwidth}{|Y|L{0.24\\textwidth}|Y|}
\\hline
\\rowcolor{lightaccent}\\textbf{Student Name} & \\textbf{Student ID} & \\textbf{Discipline / Role} \\\\ \\hline
\\placeholder{Name} & \\placeholder{ID} & \\placeholder{Discipline / role} \\\\ \\hline
\\placeholder{Name} & \\placeholder{ID} & \\placeholder{Discipline / role} \\\\ \\hline
\\placeholder{Name} & \\placeholder{ID} & \\placeholder{Discipline / role} \\\\ \\hline
\\end{tabularx}
\\end{titlepage}
\\pagenumbering{roman}
\\hypersetup{pageanchor=true}

\\section*{Template Guidance}
\\instructionbox{Replace bracketed fields and sample rows with project evidence. Add or remove rows as needed. Set \\texttt{\\textbackslash showguidancefalse} in the preamble to hide the guidance in a completed report. Remove this guidance page and the proposed rubric unless the course teacher asks to retain them.}
\\instructionbox{Use \\texttt{\\textbackslash label\\{\\}} and \\texttt{\\textbackslash ref\\{\\}} for figures and tables, and \\texttt{\\textbackslash cite\\{\\}} for references. Compile again after edits to update contents and cross-references. Enter real URLs with \\texttt{\\textbackslash url\\{\\}} or \\texttt{\\textbackslash href\\{\\}\\{\\}}; no active placeholder links are supplied. Include only results, approvals, and contributions supported by project records.}




The external collaborator questionnaire provides supplementary indirect evidence for CO 1, CO 7, and CO 9. It is part of the Intermediate Submissions and Questionnaire component, not an additional assessment weight.


\\clearpage
\\section*{Abstract}
\\phantomsection\\addcontentsline{toc}{section}{Abstract}
\\instructionbox{In approximately 150--300 words, state the clinical need, design objective, selected concept, prototype, test methods, principal measured results, and limitations.}
\\placeholder{Abstract}

\\section*{Acknowledgements}
\\phantomsection\\addcontentsline{toc}{section}{Acknowledgements}
\\instructionbox{Acknowledge clinical collaborators, supervisors, laboratories, and other assistance actually received. Omit this section if not needed.}
\\placeholder{Acknowledgements}

\\clearpage
\\tableofcontents
\\clearpage
\\phantomsection\\addcontentsline{toc}{section}{List of Figures}
\\listoffigures
\\phantomsection\\addcontentsline{toc}{section}{List of Tables}
\\listoftables

\\clearpage
\\section*{Abbreviations and Symbols}
\\phantomsection\\addcontentsline{toc}{section}{Abbreviations and Symbols}
\\instructionbox{List only abbreviations and symbols used in the completed report. Give units for physical quantities.}
\\begin{tabularx}{\\textwidth}{L{0.23\\textwidth}Y}
\\toprule\\textbf{Abbreviation / Symbol} & \\textbf{Definition / Unit} \\\\ \\midrule
\\placeholder{Term} & \\placeholder{Definition or quantity and unit} \\\\
\\bottomrule
\\end{tabularx}

\\clearpage
\\pagenumbering{arabic}
\\section{Introduction}\\label{sec:introduction}
\\instructionbox{Introduce the clinical problem and healthcare setting. Identify the affected population, current practice, and the gap that motivates the project. Support claims with project observations or cited sources.}
\\subsection{Clinical Background and Problem Statement}
\\placeholder{Clinical context, affected users, current workflow, and problem}
\\subsection{Objectives and Scope}
\\placeholder{Primary objective, measurable supporting objectives, intended use, and scope limits}

\\section{Literature Review}\\label{sec:literature}
\\instructionbox{Compare relevant studies, existing devices, treatment pathways, and technical approaches. Explain how their limitations inform the proposed design. Cite each source using IEEE-style numbered references.}
\\subsection{Existing Solutions and Treatment Pathways}
\\placeholder{Critical comparison of existing approaches}
\\subsection{Gap Analysis}
\\begin{table}[htbp]\\centering\\small
\\caption{Comparison of existing solutions}\\label{tab:literature}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Source / Solution} & \\textbf{Performance / Strength} & \\textbf{Limitation} & \\textbf{Design Implication} \\\\ \\hline
\\placeholder{Source} & \\placeholder{Evidence} & \\placeholder{Gap} & \\placeholder{Requirement} \\\\ \\hline
\\end{tabularx}\\end{table}

\\section{Clinical Needs Assessment and Prioritization}\\label{sec:needs}
\\instructionbox{Document the observation and consultation methods used, the needs identified, and the basis for prioritization. Give stakeholder names and affiliations where consent permits; use anonymized identifiers for patient information.}
\\subsection{Clinical Observations and Stakeholder Input}
\\begin{table}[htbp]\\centering\\small
\\caption{Clinical observation and consultation record}\\label{tab:stakeholders}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Date / Setting} & \\textbf{Stakeholder / Role} & \\textbf{Method} & \\textbf{Observed Need / Evidence} \\\\ \\hline
\\placeholder{Date and site} & \\placeholder{Role and affiliation} & \\placeholder{Observation / interview} & \\placeholder{Finding and record} \\\\ \\hline
\\end{tabularx}\\end{table}
\\subsection{Need Ranking and Selection}
\\instructionbox{Define High, Medium, and Low priority using stated criteria, such as patient impact, frequency, unmet need, and feasibility. Explain the evidence for each ranking.}
\\begin{table}[htbp]\\centering\\small
\\caption{Clinical need prioritization}\\label{tab:needs}
\\begin{tabularx}{\\textwidth}{|L{0.08\\textwidth}|Y|Y|L{0.14\\textwidth}|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{ID} & \\textbf{Clinical Need} & \\textbf{Evidence} & \\textbf{Priority} & \\textbf{Justification} \\\\ \\hline
N1 & \\placeholder{Need} & \\placeholder{Record / source} & \\placeholder{H / M / L} & \\placeholder{Rationale} \\\\ \\hline
\\end{tabularx}\\end{table}
\\subsection{Selected Need Statement}
\\placeholder{A need to address a defined problem for a defined population in order to achieve a stated outcome}

\\section{Design Requirements and Specifications}\\label{sec:specifications}
\\instructionbox{Translate the selected need into measurable requirements before comparing concepts. State units, thresholds, constraints, and the proposed verification method. These requirements are the basis for Table~\\ref{tab:verification}.}
\\subsection{Intended Use and Design Constraints}
\\placeholder{Intended users and setting; operating conditions; clinical, technical, cost, and usability constraints}
\\subsection{Measurable Specifications}
\\begin{table}[htbp]\\centering\\small
\\caption{Design requirements and acceptance criteria}\\label{tab:specifications}
\\begin{tabularx}{\\textwidth}{|L{0.08\\textwidth}|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{ID} & \\textbf{Requirement} & \\textbf{Target / Limit} & \\textbf{Basis / Source} & \\textbf{Verification Method} \\\\ \\hline
R1 & \\placeholder{Requirement} & \\placeholder{Value and unit} & \\placeholder{Need / evidence} & \\placeholder{Test / inspection} \\\\ \\hline
\\end{tabularx}\\end{table}

\\section{Conceptual Design and Concept Screening}\\label{sec:concept}
\\instructionbox{Present distinct concepts with sketches or diagrams. Assess clinical, technical, economic, social, cultural, and environmental feasibility. Record screening criteria, weights, scores, and the reason for selection.}
\\subsection{Concept Generation}
\\placeholder{Alternative concepts, operating principles, and sketches}
\\subsection{Feasibility and Weighted Screening}
\\instructionbox{Define the score scale and direction. Make weights sum to 1 (or 100\\%). Explain how scores were assigned and how critical constraints were applied. A weighted score does not override an unmet safety requirement.}
\\begin{table}[htbp]\\centering\\small
\\caption{Concept screening matrix}\\label{tab:screening}
\\begin{tabularx}{\\textwidth}{|Y|L{0.10\\textwidth}|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Criterion} & \\textbf{Weight} & \\textbf{Concept A} & \\textbf{Concept B} & \\textbf{Concept C} \\\\ \\hline
\\placeholder{Criterion} & \\placeholder{Weight} & \\placeholder{Score} & \\placeholder{Score} & \\placeholder{Score} \\\\ \\hline
\\textbf{Weighted Total} & 1.00 & \\placeholder{Total} & \\placeholder{Total} & \\placeholder{Total} \\\\ \\hline
\\end{tabularx}\\end{table}
For concept $j$, calculate $S_j=\\sum_{i=1}^{n}w_i s_{ij}$, where $w_i$ is the criterion weight and $s_{ij}$ is the score for that criterion.
\\subsection{Selected Concept and Trade-offs}
\\placeholder{Selected concept, rationale, unresolved trade-offs, and response to design review feedback}

\\section{Cost Estimation and Project Plan}\\label{sec:cost}
\\instructionbox{Record estimated and actual prototype costs, including components, materials, fabrication, testing, and other relevant expenses. State currency, price dates, quantity, and quotation sources. Identify in-kind resources separately.}
\\subsection{Prototype Budget and Actual Expenditure}
\\begin{table}[htbp]\\centering\\small
\\caption{Prototype cost breakdown}\\label{tab:cost}
\\begin{tabularx}{\\textwidth}{|Y|L{0.08\\textwidth}|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Item} & \\textbf{Qty.} & \\textbf{Unit Cost} & \\textbf{Estimate} & \\textbf{Actual} & \\textbf{Source / Date} \\\\ \\hline
\\placeholder{Item} & \\placeholder{Qty.} & \\placeholder{Cost} & \\placeholder{Cost} & \\placeholder{Cost} & \\placeholder{Quotation} \\\\ \\hline
\\textbf{Total} & --- & --- & \\placeholder{Total} & \\placeholder{Total} & \\placeholder{Currency} \\\\ \\hline
\\end{tabularx}\\end{table}
\\placeholder{Cost assumptions, contingency basis, cost deviations, and affordability implications}
\\subsection{Schedule and Milestones}
\\instructionbox{For a final report, compare the original schedule with actual completion dates. Explain delays and corrective actions. Put proposed next steps in Section~\\ref{sec:future}.}
\\begin{table}[htbp]\\centering\\small
\\caption{Planned and actual project milestones}\\label{tab:schedule}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Milestone} & \\textbf{Owner} & \\textbf{Planned Date} & \\textbf{Actual Date} & \\textbf{Status / Deviation} \\\\ \\hline
\\placeholder{Milestone} & \\placeholder{Member} & \\placeholder{Date} & \\placeholder{Date} & \\placeholder{Explanation} \\\\ \\hline
\\end{tabularx}\\end{table}
\\subsection{Implementation and Commercial Considerations}
\\instructionbox{Where relevant, discuss availability of materials, fabrication access, intellectual property, reimbursement or purchasing arrangements, and maintenance costs. Identify assumptions and cited sources; do not imply a patent search or commercial approval was completed without evidence.}
\\placeholder{Relevant considerations or reason a topic is outside project scope}

\\section{Prototype Development}\\label{sec:prototype}
\\instructionbox{Document the final prototype, its operating principle, component integration, and fabrication process. Include photographs, drawings, schematics, or software flowcharts appropriate to the project.}
\\subsection{System Architecture and Operating Principle}
\\placeholder{Inputs, outputs, subsystems, interfaces, and operating sequence}
\\begin{figure}[htbp]\\centering
\\fbox{\\parbox[c][3cm][c]{0.86\\linewidth}{\\centering\\placeholder{Insert system block diagram or prototype photograph}}}
\\caption{Prototype system architecture}\\label{fig:architecture}
\\end{figure}
\\subsection{Materials, Tools, and Fabrication}
\\begin{table}[htbp]\\centering\\small
\\caption{Engineering tools used and their limitations}\\label{tab:tools}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Tool / Version} & \\textbf{Purpose} & \\textbf{Output / Evidence} & \\textbf{Limitation} \\\\ \\hline
\\placeholder{Tool} & \\placeholder{Task} & \\placeholder{Drawing / code / measurement} & \\placeholder{Constraint} \\\\ \\hline
\\end{tabularx}\\end{table}
\\placeholder{Components, materials, dimensions, fabrication or implementation steps, and assembly}
\\subsection{Design Iterations and Final Configuration}
\\placeholder{Changes from the selected concept, reasons, version history, and final configuration}
\\subsection{Operation and Maintenance}
\\placeholder{Setup, operating steps, cleaning or maintenance where applicable, and known operating limits}

\\section{Testing and Validation}\\label{sec:testing}
\\instructionbox{Distinguish verification against engineering specifications from validation of the intended need. Describe the tests actually performed, including failed tests and unexpected results. Do not infer clinical effectiveness from bench testing alone.}
\\subsection{Test Protocol and Measurement Methods}
\\placeholder{Test setup, instruments, calibration, conditions, sample size, repetitions, uncertainty, and acceptance criteria}
\\subsection{Results and Verification Against Specifications}
\\begin{table}[htbp]\\centering\\small
\\caption{Verification against design specifications}\\label{tab:verification}
\\begin{tabularx}{\\textwidth}{|L{0.08\\textwidth}|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Req. ID} & \\textbf{Acceptance Criterion} & \\textbf{Test / Record} & \\textbf{Measured Result} & \\textbf{Status} \\\\ \\hline
R1 & \\placeholder{Target and unit} & \\placeholder{Test ID} & \\placeholder{Value and uncertainty} & \\placeholder{Pass / fail / not tested} \\\\ \\hline
\\end{tabularx}\\end{table}
\\placeholder{Results, plots, data analysis, failures, and deviations from the protocol}
\\subsection{User Feedback and Validation Status}
\\placeholder{Feedback received, method and date, evidence of intended-use suitability, and remaining validation needs}

\\section{Discussion and Limitations}\\label{sec:discussion}
\\instructionbox{Interpret the results in relation to the original need, design objectives, and prior solutions. Explain trade-offs, measurement uncertainty, feasibility, and what the prototype has and has not demonstrated.}
\\subsection{Interpretation and Comparison}
\\placeholder{Meaning of results and comparison with prior work and design objectives}
\\subsection{Limitations and Residual Risks}
\\placeholder{Technical, methodological, usability, cost, and validation limitations with supporting evidence}

\\section{Sustainability and Societal and Environmental Impact}\\label{sec:sustainability}
\\instructionbox{This section addresses CO 8 / PO7 (C4, K7). Evaluate the design across sourcing, fabrication, use, maintenance, and end of life. Discuss societal benefit and access as well as environmental costs. Use quantitative evidence where available; identify assumptions when data are unavailable.}
\\subsection{Lifecycle and Environmental Evaluation}
\\begin{table}[htbp]\\centering\\small
\\caption{Lifecycle sustainability assessment}\\label{tab:sustainability}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Lifecycle Stage} & \\textbf{Resource / Impact} & \\textbf{Evidence / Assumption} & \\textbf{Improvement / Trade-off} \\\\ \\hline
Materials and fabrication & \\placeholder{Material, energy, waste} & \\placeholder{Record / estimate} & \\placeholder{Action} \\\\ \\hline
Use and maintenance & \\placeholder{Power, consumables, repair} & \\placeholder{Record / estimate} & \\placeholder{Action} \\\\ \\hline
End of life & \\placeholder{Reuse, recycling, disposal} & \\placeholder{Design evidence} & \\placeholder{Action} \\\\ \\hline
\\end{tabularx}\\end{table}
\\subsection{Societal Benefit and Sustainable Use}
\\placeholder{Affordability, accessibility, local availability, serviceability, expected useful life, and trade-offs between sustainability and safety}

\\section{Societal, Health, Safety, Legal and Cultural Implications}\\label{sec:implications}
\\instructionbox{This section addresses CO 9 / PO6 (C4, K7; P2, P6, P7). Analyze project-specific implications, conflicting requirements, affected stakeholders, and interdependent design issues. Distinguish anticipated requirements from approvals actually obtained.}
\\subsection{Health and Safety Risk Assessment}
\\begin{table}[htbp]\\centering\\small
\\caption{Design risk assessment}\\label{tab:risk}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Hazard / Cause} & \\textbf{Potential Harm} & \\textbf{Initial Risk} & \\textbf{Control / Evidence} & \\textbf{Residual Risk} \\\\ \\hline
\\placeholder{Hazard} & \\placeholder{Harm} & \\placeholder{Rating} & \\placeholder{Mitigation and check} & \\placeholder{Rating} \\\\ \\hline
\\end{tabularx}\\end{table}
\\placeholder{Risk-rating definitions, operating restrictions, and remaining safety checks}
\\subsection{Legal and Regulatory Considerations}
\\instructionbox{Identify relevant jurisdiction, device category, standards, privacy requirements, and approvals only where applicable and supported by sources. State what remains to be confirmed.}
\\placeholder{Applicable requirements, evidence, current status, and outstanding work}
\\subsection{Societal and Cultural Considerations}
\\placeholder{Stakeholders, access, user acceptance, language, workflow, cultural context, and conflicts among requirements}

\\section{Team Collaboration and Communication}\\label{sec:team}
\\instructionbox{Describe multidisciplinary roles and the work completed by each member. Record meetings, design decisions, and communication with clinical or industry collaborators. Cross-reference progress records and peer reviews. CO 5 is assessed through Continuous Assessment and Intermediate Submission; communication also supports CO 7.}
\\begin{table}[htbp]\\centering\\small
\\caption{Team responsibilities and contributions}\\label{tab:team}
\\begin{tabularx}{\\textwidth}{|Y|Y|Y|Y|}
\\hline\\rowcolor{lightaccent}\\textbf{Member / Discipline} & \\textbf{Responsibility} & \\textbf{Contribution} & \\textbf{Evidence} \\\\ \\hline
\\placeholder{Member} & \\placeholder{Role} & \\placeholder{Completed work} & \\placeholder{Record / deliverable} \\\\ \\hline
\\end{tabularx}\\end{table}
\\placeholder{Coordination, communication, decision making, and resolution of difficulties}

\\section{Ethical Considerations}\\label{sec:ethics}
\\instructionbox{Describe the ethical practices actually followed during observations, consultations, and handling of clinical or patient data. CO 6 is assessed through Continuous Assessment. Include report evidence because ethical issues form part of the course's final-report description.}
\\subsection{Consent, Confidentiality, and Data Handling}
\\placeholder{Permission and consent status; anonymization; access, storage, retention, and deletion arrangements; or confirmation that no patient data were collected}
\\subsection{Ethical Risks and Safeguards}
\\placeholder{Ethical concerns, safeguards, unresolved issues, and relevant progress-record references}

\\section{External Collaborator Evaluation}\\label{sec:collaborator}
\\instructionbox{Summarize the external clinical or industry collaborator questionnaire, comparing initial expectations with the final outcome. It provides indirect evidence for CO 1, CO 7, and CO 9. If it has not been obtained, state its status without inventing feedback. Retain an accessible copy in Appendix~\\ref{app:evaluation}.}
\\placeholder{Collaborator role and affiliation, evaluation date, initial expectations, observed outcome, feedback, and response}

\\section{Future Work}\\label{sec:future}
\\instructionbox{Prioritize next steps from unmet specifications, residual risks, test limitations, sustainability findings, and collaborator feedback. State the evidence needed to complete each step.}
\\placeholder{Prioritized improvements, resources required, and proposed verification or validation}

\\section{Conclusion}\\label{sec:conclusion}
\\placeholder{Clinical need addressed, design and prototype developed, principal measured findings, objective attainment, and remaining limitations}

\\clearpage
\\renewcommand{\\refname}{Bibliography}
\\phantomsection\\addcontentsline{toc}{section}{Bibliography}
\\instructionbox{Replace the sample entry with real sources in order of first citation. Use IEEE format. Cite every listed source in the body, and include an entry for every citation. The sample entry below demonstrates structure only and is not a real publication.}
\\begin{thebibliography}{99}
\\bibitem{replace-source} \\placeholder{Author(s)}, \`\`\\placeholder{Title},'' \\textit{\\placeholder{Journal / publisher}}, \\placeholder{volume, issue, pages, year, and DOI or URL as applicable}.
\\end{thebibliography}

\\clearpage
\\appendix
\\section{Ethical Review and Permission Records}\\label{app:ethics}
\\instructionbox{Provide the ethical risk summary and references to permission, approval, and progress records where applicable. Keep confidential or identifiable patient material out of the report.}
\\placeholder{Records, safeguards, approval status, and relevant references}

\\section{Supporting Deliverable Links}\\label{app:links}
\\instructionbox{Enter actual accessible URLs and confirm that the course teacher has viewing access. Retain the names of milestones used by your course teacher; the IS-0, IS-1, and IS-2 labels below are retained from the existing template.}
\\begin{longtable}{|L{0.42\\textwidth}|L{0.49\\textwidth}|}
\\caption{Supporting project deliverables}\\label{tab:links}\\\\
\\hline\\rowcolor{lightaccent}\\textbf{Deliverable} & \\textbf{URL / Access Status} \\\\ \\hline
\\endfirsthead
\\hline\\rowcolor{lightaccent}\\textbf{Deliverable} & \\textbf{URL / Access Status} \\\\ \\hline
\\endhead
IS-0 Project Proposal Approval & \\placeholder{URL and status} \\\\ \\hline
IS-1 Clinical Needs Assessment & \\placeholder{URL and status} \\\\ \\hline
IS-2 Concept Generation and Screening & \\placeholder{URL and status} \\\\ \\hline
Design Review Presentation Slides & \\placeholder{URL and status} \\\\ \\hline
Final Presentation Slides & \\placeholder{URL and status} \\\\ \\hline
Final Demonstration Video & \\placeholder{URL and status} \\\\ \\hline
Continuous Assessment / Progress Log & \\placeholder{URL and status} \\\\ \\hline
Peer Review Forms & \\placeholder{URL and status} \\\\ \\hline
External Collaborator Evaluation & \\placeholder{URL and status} \\\\ \\hline
CAD / Schematics / Source Code & \\placeholder{URL and version} \\\\ \\hline
Test Data and Protocols & \\placeholder{URL and version} \\\\ \\hline
\\end{longtable}

\\section{Technical Documentation and Raw Test Data}\\label{app:technical}
\\instructionbox{Include drawings, schematics, detailed bill of materials, relevant code, calibration records, and raw test data needed to reproduce the reported work. Cross-reference them from the main report.}
\\placeholder{Supporting technical material}

\\section{External Collaborator Evaluation Record}\\label{app:evaluation}
\\placeholder{Completed questionnaire or accessible reference; date, collaborator role, and evaluation status}

\\clearpage
\\section*{Proposed Final Report Review Rubric}
\\phantomsection\\addcontentsline{toc}{section}{Proposed Final Report Review Rubric}
This 100-point review aid may be adapted by the course teacher. It is not an approved allocation of outcome marks. The supplied course description assigns the Report 15\\% of the course grade but gives no report-level rubric. CO 1 and CO 2 are reviewed here as project context; their listed assessment tools are Intermediate Submission and Presentation. CO 5 and CO 6 retain their separate assessment tools. Remove this rubric from the student submission unless requested.

\\instructionbox{Award points according to the completeness, accuracy, and supporting evidence for each criterion. Record a brief explanation for deductions or missing evidence. The maximum points below sum to 100.}

{\\small\\setstretch{1.0}
\\begin{longtable}{|L{0.22\\textwidth}|L{0.07\\textwidth}|L{0.49\\textwidth}|L{0.08\\textwidth}|}
\\caption{Proposed report review criteria}\\label{tab:rubric}\\\\
\\hline\\rowcolor{lightaccent}\\textbf{Criterion} & \\textbf{Max} & \\textbf{Evidence to Review} & \\textbf{Score} \\\\ \\hline
\\endfirsthead
\\hline\\rowcolor{lightaccent}\\textbf{Criterion} & \\textbf{Max} & \\textbf{Evidence to Review} & \\textbf{Score} \\\\ \\hline
\\endhead
\\multicolumn{4}{|l|}{\\textbf{CO 1 / PO2 -- Clinical Need (15 points; contextual review)}} \\\\ \\hline
1.1 Need definition & 5 & Specific problem, target population, setting, and evidence of the need's importance. & \\\\ \\hline
1.2 Literature and gap analysis & 5 & Critical comparison of existing solutions, cited technical claims, and a clear design gap. & \\\\ \\hline
1.3 Needs assessment & 5 & Documented observations, defined ranking criteria, consistent priorities, and justified need selection. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{CO 2 / PO3 -- Concept Design (15 points; contextual review)}} \\\\ \\hline
2.1 Requirements and concepts & 5 & Measurable requirements and distinct concepts responding to the selected need. & \\\\ \\hline
2.2 Screening process & 5 & Defined criteria, justified weights, transparent scores, and feasibility checks. & \\\\ \\hline
2.3 Design selection & 5 & Evidence for the selected concept and clinical, social, cultural, and environmental trade-offs. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{CO 3 / PO11 -- Cost and Planning (10 points)}} \\\\ \\hline
3.1 Cost breakdown & 5 & Quantities, sources, currency, component and fabrication expenses, and estimated versus actual costs. & \\\\ \\hline
3.2 Project plan & 5 & Responsibilities, dated milestones, actual progress, and explanations of deviations. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{CO 4 / PO5 -- Prototype and Testing (20 points)}} \\\\ \\hline
4.1 Prototype and tools & 8 & Architecture, fabrication, components, engineering tools and their limitations, and documented design changes. & \\\\ \\hline
4.2 Test methods and results & 7 & Reproducible setup, measurements, uncertainty, and complete reporting of positive and negative results. & \\\\ \\hline
4.3 Specification verification & 5 & Evidence-based comparison of each requirement with results; failed or untested requirements identified. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{CO 7 / PO10 -- Communication (10 points)}} \\\\ \\hline
7.1 Structure and references & 5 & Logical organization, readable figures and tables, accurate citations, and working cross-references. & \\\\ \\hline
7.2 Technical communication & 5 & Clear technical writing and documented communication within the team and with collaborators. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{CO 8 / PO7 -- Sustainability and Impact (10 points)}} \\\\ \\hline
8.1 Sustainability & 10 & Lifecycle impacts, materials, energy, repair, disposal, societal access, and evidence for proposed improvements. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{CO 9 / PO6 -- Engineer and Society (10 points)}} \\\\ \\hline
9.1 Implications and risks & 10 & Project-specific societal, health, safety, legal, and cultural analysis; stakeholder conflicts, risk controls, and residual risks. & \\\\ \\hline
\\multicolumn{4}{|l|}{\\textbf{General Report Completeness (10 points; not CO-mapped)}} \\\\ \\hline
G.1 Team and ethical records & 5 & Specific team contributions and ethical practices consistent with available project records. & \\\\ \\hline
G.2 Supporting material & 5 & Discussion, limitations, future work, conclusion, bibliography, accessible deliverables, technical records, and collaborator evaluation status. & \\\\ \\hline
\\end{longtable}}

\\clearpage
\\subsection*{Marking Summary}
\\begin{tabularx}{\\textwidth}{|Y|L{0.10\\textwidth}|L{0.15\\textwidth}|}
\\hline\\rowcolor{lightaccent}\\textbf{Category} & \\textbf{Max} & \\textbf{Score} \\\\ \\hline
CO 1 / PO2 -- Clinical Need (contextual) & 15 & \\\\ \\hline
CO 2 / PO3 -- Concept Design (contextual) & 15 & \\\\ \\hline
CO 3 / PO11 -- Cost and Planning & 10 & \\\\ \\hline
CO 4 / PO5 -- Prototype and Testing & 20 & \\\\ \\hline
CO 7 / PO10 -- Communication & 10 & \\\\ \\hline
CO 8 / PO7 -- Sustainability and Impact & 10 & \\\\ \\hline
CO 9 / PO6 -- Engineer and Society & 10 & \\\\ \\hline
General Report Completeness & 10 & \\\\ \\hline
\\textbf{Total} & \\textbf{100} & \\\\ \\hline
\\end{tabularx}
\\subsection*{Evaluator Comments}
\\placeholder{Strengths, missing evidence, and recommended improvements}\\par
\\medskip
\\begin{tabularx}{\\textwidth}{|L{0.30\\textwidth}|Y|}
\\hline\\textbf{Evaluator Name} & \\\\ \\hline
\\textbf{Designation} & \\\\ \\hline
\\textbf{Signature} & \\\\ \\hline
\\textbf{Date} & \\\\ \\hline
\\end{tabularx}
\\end{document}
`
