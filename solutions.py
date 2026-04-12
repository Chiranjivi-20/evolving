# =============================================================================
#  LOAN BIAS DETECTION TOOL — STREAMLIT WEB APP
#
#  HOW TO RUN LOCALLY:
#    1. pip install streamlit pandas matplotlib seaborn scipy google-generativeai openpyxl
#    2. Create a file called .streamlit/secrets.toml and add:
#       GEMINI_API_KEY = "your_api_key_here"
#    3. streamlit run streamlit_app.py
#
#  HOW TO DEPLOY ON STREAMLIT CLOUD:
#    1. Push this file to your GitHub repo
#    2. Go to share.streamlit.io and connect your repo
#    3. In Settings > Secrets, add: GEMINI_API_KEY = "your_api_key_here"
#    4. Deploy!
# =============================================================================

import warnings
warnings.filterwarnings("ignore")

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from scipy import stats
import google.generativeai as genai
import json
import io

# =============================================================================
# PAGE CONFIGURATION
# =============================================================================

st.set_page_config(
    page_title="Loan Bias Detection Tool",
    page_icon="⚖️",
    layout="wide"
)

# =============================================================================
# STYLING
# =============================================================================

st.markdown("""
<style>
    .main-title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #1a1a2e;
        margin-bottom: 0.2rem;
    }
    .subtitle {
        color: #555;
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 1.2rem;
        border-left: 5px solid #4C72B0;
        margin-bottom: 1rem;
    }
    .bias-detected {
        background: #fff5f5;
        border-left: 5px solid #C44E52;
        border-radius: 12px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    .bias-fair {
        background: #f0fff4;
        border-left: 5px solid #55A868;
        border-radius: 12px;
        padding: 1rem;
        margin: 0.5rem 0;
    }
    .ai-insight {
        background: #f0f4ff;
        border-radius: 10px;
        padding: 1rem;
        margin-top: 0.5rem;
        border-left: 4px solid #4C72B0;
        font-style: italic;
    }
    .section-header {
        font-size: 1.4rem;
        font-weight: 700;
        color: #1a1a2e;
        margin-top: 2rem;
        margin-bottom: 1rem;
        border-bottom: 2px solid #eee;
        padding-bottom: 0.4rem;
    }
</style>
""", unsafe_allow_html=True)

# =============================================================================
# GEMINI SETUP — reads API key from Streamlit Secrets (safe for deployment)
# =============================================================================

try:
    API_KEY = st.secrets["GEMINI_API_KEY"]
    genai.configure(api_key=API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    gemini_available = True
except Exception:
    gemini_available = False

# =============================================================================
# HEADER
# =============================================================================

st.markdown('<div class="main-title">⚖️ Loan Bias Detection Tool</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Detect hidden unfairness in credit/loan decision data — powered by Gemini AI</div>', unsafe_allow_html=True)

if not gemini_available:
    st.warning("⚠️ Gemini API key not configured. Statistical analysis will run, but AI explanations will be unavailable.")

# =============================================================================
# STEP 1: FILE UPLOAD — replaces hardcoded file path
# =============================================================================

st.markdown('<div class="section-header">📂 Step 1: Upload Your Dataset</div>', unsafe_allow_html=True)

uploaded_file = st.file_uploader(
    "Upload your loan dataset (CSV file)",
    type=["csv"],
    help="Your CSV should contain columns like: Credit Score, Annual Income, Home Ownership, Purpose, Term, Years in current job"
)

if uploaded_file is None:
    st.info("👆 Please upload a CSV file to begin the analysis.")
    st.stop()

# =============================================================================
# STEP 2: LOAD & CLEAN DATA
# =============================================================================

@st.cache_data
def load_and_clean(file):
    df = pd.read_csv(file)

    # Fix inconsistent labels
    df["Purpose"] = df["Purpose"].str.strip().str.title()
    df["Home Ownership"] = df["Home Ownership"].replace("HaveMortgage", "Home Mortgage")

    # Fill missing values
    df["Credit Score"] = df["Credit Score"].fillna(df["Credit Score"].median())
    df["Annual Income"] = df["Annual Income"].fillna(df["Annual Income"].median())
    df["Bankruptcies"]  = df["Bankruptcies"].fillna(0)
    df["Tax Liens"]     = df["Tax Liens"].fillna(0)

    # Drop rows missing critical info
    df = df.dropna(subset=["Years in current job"])
    return df

df = load_and_clean(uploaded_file)

st.success(f"✅ Dataset loaded successfully — **{len(df):,} rows** and **{len(df.columns)} columns** after cleaning.")

# =============================================================================
# STEP 3: APPROVAL THRESHOLD SETTING
# =============================================================================

st.markdown('<div class="section-header">⚙️ Step 2: Set Approval Rule</div>', unsafe_allow_html=True)

APPROVAL_THRESHOLD = st.slider(
    "Credit Score Approval Threshold",
    min_value=500,
    max_value=850,
    value=700,
    step=10,
    help="Applicants with Credit Score >= this value will be marked as Approved."
)

df["Approved"] = (df["Credit Score"] >= APPROVAL_THRESHOLD).astype(int)

total    = len(df)
approved = df["Approved"].sum()
rejected = total - approved

col1, col2, col3 = st.columns(3)
col1.metric("Total Applicants", f"{total:,}")
col2.metric("Approved",  f"{approved:,}", f"{approved/total*100:.1f}%")
col3.metric("Rejected",  f"{rejected:,}", f"-{rejected/total*100:.1f}%")

# =============================================================================
# STEP 4: KEY DISTRIBUTIONS CHART
# =============================================================================

st.markdown('<div class="section-header">📊 Step 3: Dataset Overview</div>', unsafe_allow_html=True)

fig, axes = plt.subplots(2, 2, figsize=(14, 8))
fig.suptitle("Dataset Overview — Key Distributions", fontsize=15, fontweight="bold")

axes[0, 0].hist(df["Credit Score"], bins=40, color="#4C72B0", edgecolor="white")
axes[0, 0].axvline(APPROVAL_THRESHOLD, color="red", linestyle="--", linewidth=2,
                   label=f"Threshold ({APPROVAL_THRESHOLD})")
axes[0, 0].set_title("Credit Score Distribution")
axes[0, 0].set_xlabel("Credit Score")
axes[0, 0].set_ylabel("Number of Applicants")
axes[0, 0].legend()

axes[0, 1].hist(df["Annual Income"].clip(upper=300000), bins=40, color="#55A868", edgecolor="white")
axes[0, 1].set_title("Annual Income (capped at $300k)")
axes[0, 1].set_xlabel("Annual Income ($)")
axes[0, 1].set_ylabel("Number of Applicants")

home_counts = df["Home Ownership"].value_counts()
axes[1, 0].bar(home_counts.index, home_counts.values, color="#C44E52", edgecolor="white")
axes[1, 0].set_title("Applicants by Home Ownership")
axes[1, 0].set_xlabel("Home Ownership")
axes[1, 0].set_ylabel("Count")
axes[1, 0].tick_params(axis="x", rotation=15)

purpose_counts = df["Purpose"].value_counts().head(8)
axes[1, 1].barh(purpose_counts.index, purpose_counts.values, color="#8172B2")
axes[1, 1].set_title("Top Loan Purposes")
axes[1, 1].set_xlabel("Count")
axes[1, 1].invert_yaxis()

plt.tight_layout()
st.pyplot(fig)
plt.close()

# =============================================================================
# STEP 5: BIAS ANALYSIS FUNCTION
# =============================================================================

def get_ai_insight(label, stats_summary, disparate_impact, p_value):
    """Calls Gemini AI to explain the bias finding."""
    if not gemini_available:
        return "AI insights unavailable — Gemini API key not configured.", "Manual review required."

    prompt = f"""
    Analyze these loan approval statistics for the group '{label}':
    {stats_summary}

    Metrics:
    - Disparate Impact Ratio: {disparate_impact} (Fairness threshold is 0.80)
    - Statistical P-Value: {p_value:.4f}

    Provide a concise explanation (2 sentences) of why this specific group might be facing bias
    and one specific recommendation to mitigate it.
    Return ONLY valid JSON in this exact format with no extra text or markdown:
    {{"explanation": "...", "recommendation": "..."}}
    """
    try:
        response = gemini_model.generate_content(prompt)
        clean = response.text.strip().replace("```json", "").replace("```", "")
        data  = json.loads(clean)
        return data.get("explanation", "N/A"), data.get("recommendation", "N/A")
    except Exception:
        return "AI interpretation unavailable.", "Manual review required."


def analyze_bias(dataframe, group_column, label):
    """Runs statistical bias analysis and fetches Gemini AI interpretation."""

    group_stats = dataframe.groupby(group_column)["Approved"].agg(
        Total="count", Approved="sum"
    ).reset_index()
    group_stats["Approval Rate (%)"] = (group_stats["Approved"] / group_stats["Total"] * 100).round(2)
    group_stats = group_stats.sort_values("Approval Rate (%)", ascending=False)

    max_rate = group_stats["Approval Rate (%)"].max()
    min_rate = group_stats["Approval Rate (%)"].min()
    disparate_impact = round(min_rate / max_rate, 4) if max_rate > 0 else 1.0

    contingency = pd.crosstab(dataframe[group_column], dataframe["Approved"])
    if contingency.shape[0] < 2:
        chi2, p_value = 0.0, 1.0
    else:
        chi2, p_value, _, _ = stats.chi2_contingency(contingency)

    bias_detected = disparate_impact < 0.80
    explanation, recommendation = get_ai_insight(
        label, group_stats.to_string(index=False), disparate_impact, p_value
    )

    group_stats["Disparate Impact"]  = disparate_impact
    group_stats["Chi2 p-value"]      = round(p_value, 4)
    group_stats["Bias Flag"]         = "BIAS DETECTED" if bias_detected else "FAIR"
    group_stats["AI_Explanation"]    = explanation
    group_stats["AI_Recommendation"] = recommendation

    return group_stats, disparate_impact, p_value, bias_detected, explanation, recommendation


def plot_approval_bar(group_stats, group_column, label):
    """Returns a colour-coded bar chart figure."""
    fig, ax = plt.subplots(figsize=(10, 4))
    max_rate = group_stats["Approval Rate (%)"].max()
    colors = [
        "#C44E52" if (r / max_rate) < 0.80 else "#55A868"
        for r in group_stats["Approval Rate (%)"]
    ]
    bars = ax.bar(group_stats[group_column], group_stats["Approval Rate (%)"],
                  color=colors, edgecolor="white", width=0.6)
    for bar, val in zip(bars, group_stats["Approval Rate (%)"]):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5,
                f"{val:.1f}%", ha="center", va="bottom", fontsize=9, fontweight="bold")
    green_patch = mpatches.Patch(color="#55A868", label="Within fair range")
    red_patch   = mpatches.Patch(color="#C44E52", label="⚠️ Below 80% threshold")
    ax.legend(handles=[green_patch, red_patch], loc="lower right")
    ax.set_title(f"Approval Rate by {label}", fontsize=13, fontweight="bold")
    ax.set_xlabel(label)
    ax.set_ylabel("Approval Rate (%)")
    ax.set_ylim(0, max_rate * 1.25)
    ax.tick_params(axis="x", rotation=20)
    plt.tight_layout()
    return fig

# =============================================================================
# STEP 6: RUN ANALYSIS
# =============================================================================

st.markdown('<div class="section-header">🔍 Step 4: Bias Analysis Results</div>', unsafe_allow_html=True)

groups = [
    ("Home Ownership",       "Home Ownership"),
    ("Purpose",              "Loan Purpose"),
    ("Years in current job", "Years in Current Job"),
    ("Term",                 "Loan Term"),
]

all_results = {}

with st.spinner("Running AI-powered bias analysis... this may take a moment ⏳"):
    for col, label in groups:
        result, di, pval, bias, explanation, recommendation = analyze_bias(df, col, label)
        all_results[label] = (result, col, di, pval, bias, explanation, recommendation)

# =============================================================================
# STEP 7: DISPLAY RESULTS PER GROUP
# =============================================================================

for label, (result, col, di, pval, bias, explanation, recommendation) in all_results.items():

    card_class = "bias-detected" if bias else "bias-fair"
    verdict    = "⚠️ BIAS DETECTED" if bias else "✅ FAIR"

    st.markdown(f"#### {label}")

    left, right = st.columns([1.5, 1])

    with left:
        fig = plot_approval_bar(result, col, label)
        st.pyplot(fig)
        plt.close()

    with right:
        st.markdown(f'<div class="{card_class}">'
                    f'<b>Verdict:</b> {verdict}<br><br>'
                    f'<b>Disparate Impact Ratio:</b> {di:.4f} <small>(threshold: 0.80)</small><br>'
                    f'<b>Chi² p-value:</b> {pval:.4f} — {"Statistically significant" if pval < 0.05 else "Not significant"}'
                    f'</div>', unsafe_allow_html=True)

        st.markdown(f'<div class="ai-insight">'
                    f'🤖 <b>Gemini AI Insight:</b><br>{explanation}<br><br>'
                    f'💡 <b>Recommendation:</b> {recommendation}'
                    f'</div>', unsafe_allow_html=True)

        st.dataframe(result[[col, "Total", "Approved", "Approval Rate (%)"]],
                     use_container_width=True, hide_index=True)

    st.divider()

# =============================================================================
# STEP 8: DOWNLOAD RESULTS
# =============================================================================

st.markdown('<div class="section-header">⬇️ Step 5: Download Results</div>', unsafe_allow_html=True)

# Build Excel file in memory — no file path needed
output = io.BytesIO()
with pd.ExcelWriter(output, engine="openpyxl") as writer:
    for label, (result, col, di, pval, bias, explanation, recommendation) in all_results.items():
        sheet_name = label[:31]  # Excel sheet name limit
        result.to_excel(writer, sheet_name=sheet_name, index=False)

st.download_button(
    label="📥 Download Full Bias Report (Excel)",
    data=output.getvalue(),
    file_name="bias_analysis_results.xlsx",
    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)

# =============================================================================
# FOOTER
# =============================================================================

st.markdown("---")
st.markdown(
    "<center><small>Built with Streamlit · Powered by Gemini AI · Google Solution Challenge</small></center>",
    unsafe_allow_html=True
)
