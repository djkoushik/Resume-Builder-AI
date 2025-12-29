Here is the comprehensive, structured specification for the **"Logic Engine" ATS**. As requested, this version retains all the detailed steps and logic defined in our previous analysis, with specific **visual flowcharts embedded within each phase** to illustrate the step-by-step data flow.

---

# **📑 Product Specification: The "Logic Engine" ATS (JSON-Architecture)**

Version: 3.1 (Visualized)  
Architecture Type: Pure Logic / Linear Data Pipeline  
Objective: To accept structured Candidate and Job Data, process it through a weighted algorithm, and return a compatibility score with gap analysis.

---

### **1\. High-Level Architecture**

The system operates as a linear data pipeline with **five** distinct, mandatory stages.

* **Input A:** Candidate\_Profile\_JSON  
* **Input B:** Job\_Description\_JSON  
* **Output:** Match\_Result\_JSON

**The Pipeline Flow:**

1. **JD Parser:** Extract and structure keywords from the raw JD.  
2. **Validator:** Gatekeeper for schema integrity.  
3. **Normalizer:** Data cleaning and standardization.  
4. **Mapper:** Semantic translation (Synonyms).  
5. **Scorer:** Mathematical calculation engine.

---

### **Phase 0: JD Parsing and Dismantling**

**Objective:** Systematically extract and categorize all data points and keywords from the raw Job Description (JD) JSON for downstream consumption.

**Detailed Steps:**

1. **Ingest Raw JD:** Accept the raw JSON object.  
2. **Component Extraction:**  
   * **JD\_Required\_Skills:** Extract list from jd.required\_skills.  
   * **JD\_Experience\_Range:** Extract integer from jd.min\_years and jd.max\_years.  
   * **JD\_Semantic\_Keywords:** Extract keywords from the JD's main description block (jd.description.long\_text) using pre-defined NLP entities.  
3. **Critical Flagging:** Identify any skills explicitly marked as "Critical" or "Must Have" and separate them into a dedicated set: JD\_P0\_Skills\_Set.  
4. **Tokenization:** Perform initial tokenization on the long text description and filter stop words (e.g., "the", "and").

#### **📉 Phase 0 Flowchart**

Code snippet

graph TD  
    A\[Start: Raw JD JSON Input\] \--\> B\[Extract Required Skills List\];  
    B \--\> C\[Extract Min/Max Experience Integers\];  
    C \--\> D\[Scan for 'Critical' Flags\];  
    D \--\> E\[Create JD\_P0\_Skills\_Set\];  
    E \--\> F\[Tokenize Description Text & Remove Stop Words\];  
    F \--\> G\[Output: Structured JD Components\];  
      
    style A fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px  
    style G fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px

---

### **Phase 1: Validation**

**Objective:** Ensure structural integrity of both the Candidate and the extracted JD data.

**Detailed Steps:**

1. **Input Check:** Receive Candidate JSON and the Structured JD Components (from Phase 0).  
2. **Schema Logic:** Check for existence of essential root nodes:  
   * candidate.skills  
   * candidate.experience  
   * JD\_Required\_Skills  
   * JD\_Experience\_Range  
3. **Exception Handling:**  
   * **IF** nodes exist $\\rightarrow$ Mark as Valid.  
   * **IF** nodes IS NULL $\\rightarrow$ Return **Error 400: Invalid Schema**.

#### **📉 Phase 1 Flowchart**

Code snippet

graph TD  
    A\[Inputs: Candidate JSON & JD Components\] \--\> B{Check Candidate Root Nodes};  
    B \-- Missing \--\> C\[❌ Error 400: Invalid Schema\];  
    B \-- Exists \--\> D{Check JD Root Nodes};  
    D \-- Missing \--\> C;  
    D \-- Exists \--\> E\[✅ Validation Passed\];  
    E \--\> F\[Proceed to Normalizer\];

    style A fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px  
    style C fill:\#FADBD8,stroke:\#E74C3C,stroke-width:2px  
    style E fill:\#D4EFDF,stroke:\#27AE60,stroke-width:2px

---

### **Phase 2: The Normalizer (The "Sanitizer")**

**Objective:** Apply consistent cleaning rules to prevent matching errors and neutralize data injection.

**Detailed Steps:**

1. **Text Sanitization:** Apply **Case Folding** (to lowercase) and **Whitespace Trimming** to all string inputs (Candidate Skills, JD Skills, Keywords).  
2. **Deduplication (Security):** Convert all skill arrays to **Sets**.  
   * *Logic:* \['sql', 'SQL', 'sql'\] $\\rightarrow$ {'sql'}. This neutralizes keyword stuffing.  
3. **Date Standardization:** Convert Candidate end\_date fields.  
   * "Present", "Current", "Now" $\\rightarrow$ Current System Timestamp.  
   * Format $\\rightarrow$ ISO-8601 (YYYY-MM-DD).  
4. **Edge Case Defense:** Check if candidate.skills is empty.  
   * **If Empty:** Trigger **Fallback Regex** against job\_history.description to find skills.  
   * **If Not Empty:** Proceed.

#### **📉 Phase 2 Flowchart**

Code snippet

graph TD  
    A\[Input: Validated Data\] \--\> B\[Apply Case Folding & Trimming\];  
    B \--\> C\[Convert Arrays to Sets (Deduplication)\];  
    C \--\> D\[Standardize Dates to ISO-8601\];  
    D \--\> E{Is Candidate Skills Array Empty?};  
    E \-- Yes \--\> F\[Run Fallback Regex on Job History\];  
    F \--\> G\[Populate Skills Dynamically\];  
    E \-- No \--\> H\[Keep Existing Skills\];  
    G \--\> I\[Output: Clean, Standardized Data\];  
    H \--\> I;

    style A fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px  
    style F fill:\#F9E79F,stroke:\#F1C40F,stroke-width:2px  
    style I fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px

---

### **Phase 3: The Semantic Mapper (The "Brain")**

**Objective:** Resolve vocabulary mismatches between the Candidate and JD using a reference dictionary and fuzzy matching.

**Detailed Steps:**

1. **Load Map & Index:** Access the Canonical Hash Map and the Fuse.js index (standardSkills).
2. **Iteration:** Loop through every item in the standardized Candidate Skills and JD Skills sets.
3. **Lookup & Replace (Hybrid Strategy):**
   * **Tier 1 (Exact):** Check if skill exists in `standardSkills`. If true, keep.
   * **Tier 2 (Alias):** Check if skill exists as a **Key** in `canonicalMap`. If true, replace with Value.
   * **Tier 3 (Fuzzy):** If no exact/alias match, run `Fuse.js` search.
     * **Condition:** Score < 0.3 (Strict match).
     * **Action:** Replace with the matched standard term.
   * **Fallback:** Retain original string (niche skill).

#### **📉 Phase 3 Flowchart**

```mermaid
graph TD
    A[Input: Standardized Skills Lists] --> B[Load Canonical Map & Fuse Index];
    B --> C[Start Loop: For Each Skill Item];
    C --> D{Is Skill in Standard List?};
    D -- Yes --> G[Add to Canonical List];
    D -- No --> E{Is Skill Alias in Map?};
    E -- Yes --> F[Replace with Canonical ID];
    F --> G;
    E -- No --> H{Fuzzy Match < 0.3?};
    H -- Yes --> I[Use Fuzzy Match Result];
    I --> G;
    H -- No --> J[Keep Original String];
    J --> G;
    G --> K{More Items?};
    K -- Yes --> C;
    K -- No --> L[Output: Semantic/Canonical Data IDs];

    style A fill:#E8F8F5,stroke:#1ABC9C,stroke-width:2px
    style L fill:#E8F8F5,stroke:#1ABC9C,stroke-width:2px
```

---

---

### **Phase 4: The Scoring Algorithm**

**Objective:** Calculate the weighted compatibility score using the Master Formula.

$$Score\\\_{Total} \= (W\\\_1 \\times S\\\_{Hard}) \+ (W\\\_2 \\times S\\\_{Skill}) \+ (W\\\_3 \\times S\\\_{Sem}) \- P\\\_{Penalty}$$  
**Detailed Steps:**

1. **$S\_{Hard}$ (40%):**  
   * Compare Candidate Years vs. JD Range.  
   * Apply Bell Curve: 0.0 (Under), 0.9 (Over/Seniority Penalty), 1.0 (Perfect).  
   * Check Education (Binary 0 or 1).  
2. **$S\_{Skill}$ (35%):**  
   * Calculate Intersection of Candidate and JD sets.  
   * Formula: Match\_Count / Total\_JD\_Skills.  
3. **Critical Penalty Check:**  
   * Check if any skill in JD\_P0\_Skills\_Set is missing from Candidate.  
   * **If Missing:** Multiply $S\_{Skill}$ by **0.5**.  
4. **$S\_{Sem}$ (25%):**  
   * Scan Candidate text for JD\_Semantic\_Keywords.  
   * Score based on unique matches found.  
5. **Final Sum:** aggregate all weighted scores.

#### **📉 Phase 4 Flowchart**

Code snippet

graph TD  
    A\[Input: Canonical Data\] \--\> B\[Calculate S\_Hard (Exp & Edu)\];  
    B \--\> C\[Calculate S\_Skill Raw (Intersection)\];  
    C \--\> D{Is P0/Critical Skill Missing?};  
    D \-- Yes \--\> E\[⚠️ Apply Penalty: Score \* 0.5\];  
    D \-- No \--\> F\[Keep S\_Skill Raw Score\];  
    E \--\> G\[Calculate S\_Sem (Keywords)\];  
    F \--\> G;  
    G \--\> H\[Apply Weights W1, W2, W3\];  
    H \--\> I\[Compute Final Score\_Total\];

    style A fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px  
    style E fill:\#FADBD8,stroke:\#E74C3C,stroke-width:2px  
    style I fill:\#D4EFDF,stroke:\#27AE60,stroke-width:2px

---

### **Phase 5: Output Generation**

**Objective:** Compile the mathematical results into a user-friendly JSON response.

**Detailed Steps:**

1. **Gap Analysis:** Compare lists to identify specific missing skills (Critical vs. Bonus).  
2. **Flag Generation:** Generate textual explanation for experience mismatch (e.g., "Candidate is Senior").  
3. **JSON Construction:** Assemble the meta, results, breakdown, and gap\_analysis objects.  
4. **Return:** Send final payload to API.

#### **📉 Phase 5 Flowchart**

Code snippet

graph TD  
    A\[Input: Calculated Scores\] \--\> B\[Identify Missing Critical Skills\];  
    B \--\> C\[Identify Missing Bonus Skills\];  
    C \--\> D\[Generate Experience Flag Text\];  
    D \--\> E\[Assemble Breakdown Object\];  
    E \--\> F\[Construct Final JSON\];  
    F \--\> G\[🚀 Return Match\_Result\_JSON\];

    style A fill:\#E8F8F5,stroke:\#1ABC9C,stroke-width:2px  
    style G fill:\#D4EFDF,stroke:\#27AE60,stroke-width:2px  
