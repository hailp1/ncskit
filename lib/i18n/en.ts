import asigEn from '../../locales/en/asig.json';

export const en = {
    asig: asigEn,
        // Header
        nav: {
            analyze: 'Statistics & Analysis',
            analyze1: 'Standard Statistical Engine',
            analyze2: 'Advanced PLS-SEM Academy',
            research_model: 'Scales & Models',
            academic_scales: 'Academic Scales Library',
            research_models: 'Research Models Library',
            cite_check: 'Cite Check - Citation Verifier',
            docs: 'Documentation',
            theory: 'Statistical Theory',
            casestudy: 'Research Scenarios',
            userguide: 'User Guide',
            profile: 'Profile',
            knowledge_hub: 'Knowledge Hub',
            knowledge_guides: 'Help',
            login: 'Login',
            logout: 'Logout'
        },
        // Status labels
        status: {
            available: 'Available',
            coming: 'Coming Soon'
        },
        // Beta warning
        beta: {
            warning: 'System is in Beta testing phase. Please verify results before using for official publications.',
            learnMore: 'View disclaimer'
        },
        // Hero Section
        hero: {
            badge: 'V1.2.0: Beta Version',
            title: 'Advanced Statistics',
            subtitle: 'Scientific Standard for Researchers',
            description: 'Professional data analysis platform powered by R-Engine and AI Assistant. Absolute accuracy, maximum security, zero installation.',
            cta: 'Start Researching',
            learn: 'How it works'
        },
        // PLS-SEM Banner (New)
        plssem: {
            badge: 'NCSSTAT WORKFLOW',
            title: 'Statistical Analysis System',
            description: 'Professional APA-standard workflow: Data Cleaning - Reliability - EFA/CFA - SEM & Regression',
            cta: 'Start Analyzing',
            methods: {
                omega: "Cronbach's Alpha",
                htmt: 'EFA & CFA',
                bootstrap: 'Linear Regression',
                ipma: 'PLS-SEM Modeling'
            }
        },
        // Workflow (New)
        workflow: {
            title: 'Standard 4-Step Process',
            step1: {
                title: 'Import Data',
                desc: 'Support Excel/CSV formats. Automatic data structure validation.'
            },
            step2: {
                title: 'Review & Clean',
                desc: 'Auto-detect missing values, outliers, and assess data quality before processing.'
            },
            step3: {
                title: 'Select Analysis',
                desc: 'Intuitive menu covering all methods from EFA, CFA to complex SEM models.'
            },
            step4: {
                title: 'Get Report',
                desc: 'Detailed APA-standard results, professional charts, and AI-powered interpretation.'
            }
        },
        // Features
        features: {
            speed: {
                title: 'High Performance',
                desc: 'Runs directly in-browser via advanced WebAssembly technology. Fast, stable, and efficient processing.'
            },
            ai: {
                title: 'AI Research Assistant',
                desc: 'Automated analysis and interpretation of statistical results. Identifies issues and proposes optimal solutions.'
            },
            security: {
                title: 'High-Level Security',
                desc: 'Zero-Knowledge architecture. Data is processed 100% locally on your device (Client-side), ensuring absolute privacy.'
            },
            why_title: 'Why choose ncsStat?',
            library_title: 'Knowledge Base',
            library_desc: 'Access 500+ international scientific scales (2020-2026) pre-integrated. Intelligent research model advisory.',
            explore_library: 'Explore Library'
        },
        // Methods
        methods: {
            title: 'Analysis Methodology System',
            subtitle: 'Comprehensive toolkit supporting all statistical tests for Theses and Dissertations.',
            reliability: 'Scale Reliability',
            efa: 'Exploratory EFA',
            cfa: 'Confirmatory CFA',
            sem: 'Structural SEM',
            regression: 'Regression Analysis',
            comparison: 'Hypothesis Testing',
            correlation: 'Correlation Analysis',
            nonparam: 'Non-parametric Tests'
        },
        // Methods Guide Page
        methods_guide_page: {
            title: 'Statistical Methods Guide',
            desc: 'Detailed documentation on procedures and results interpretation for each analysis method on the ncsStat system.'
        },
        // Docs Overview Page
        docs_overview: {
            title: 'Guidance & Documentation Center',
            subtitle: 'Explore statistical knowledge, standard research workflows, and ncsStat system operation guides.',
            theory_desc: 'Understand p-value, Cronbach Alpha, and how to interpret scientific results.',
            casestudy_desc: 'A 5-step process for conducting a publication-ready quantitative research paper.',
            userguide_desc: 'Detailed instructions on how to use all ncsStat analysis features.',
            cta: 'Explore now',
            why_title: 'Why is this documentation important?',
            reason1_title: 'Ensure Scientific Accuracy',
            reason1_desc: 'Helps you understand the nature of numbers rather than just running calculations mechanically.',
            reason2_title: 'Standardize Workflow',
            reason2_desc: 'Provides a standard processing flow from cleaning to reporting, reducing errors in Thesis/Dissertations.'
        },
        // Docs Specific Labels
        docs_theory_labels: {
            sig95: '95% Significance',
            sig99: '99% Significance',
            sig999: '99.9% Significance',
            predictive_accuracy: 'Predictive Accuracy',
            effect_size: 'Effect Size',
            predictive_relevance: 'Predictive Relevance',
            mediation_analysis: 'Mediation Analysis',
            bootstrapping_info: 'Bootstrapping (5000 samples)'
        },
        docs_casestudy_labels: {
            mean_sd: 'Mean & S.D',
            freq_table: 'Frequency Table',
            demo_plot: 'Demographics Plot',
            hypothesis_example: 'H1: Usefulness -> Intention',
            result_stat: 'Beta = 0.45; p < 0.001'
        },
        docs_userguide_labels: {
            selecting_title: 'Selecting Variables',
            selecting_desc: 'Hold Shift or Ctrl to select multiple variables at once in menu tables.',
            apa_title: 'APA Reporting',
            apa_desc: 'The system automatically formats tables and charts according to the latest APA standards.',
            support_title: 'Support',
            support_desc: 'Join the ncsStat community to have your data processing questions answered.',
            procedure_title: 'Operating Procedure',
            output_title: 'Standard Output'
        },
        // Footer
        footer: {
            terms: 'Terms of Service',
            privacy: 'Privacy Policy',
            docs: 'Documentation',
            status: 'System Status',
            operational: 'Operational',
            resources: 'Resources',
            system: 'System',
            disclaimer: 'Disclaimer (Beta)',
            aboutTitle: 'About ncsStat Project',
            aboutDesc: 'ncsStat is a specialized platform supporting data processing for Doctoral candidates. We focus on the accuracy of R algorithms and user interface convenience. The system is currently in Beta and is continuously improved based on feedback from the scientific community. Our goal is to accompany you on the path to conquering international publications.'
        },
        // Analyze Page
        analyze: {
            steps: {
                upload: 'Data Initialization',
                profile: 'Data Audit',
                analyze: 'Execute Analysis',
                results: 'Result Reporting'
            },
            upload: {
                title: 'Import your dataset',
                desc: 'Supports standard .csv, .xlsx and .xls formats',
                dropzone: 'Drag & drop your file here, or click to select',
                orClick: 'or click to select file (CSV, Excel)',
                processing: 'Processing...',
                sampleData: 'Try sample data (N=300)',
                testData: 'Test SEM/CFA (N=500, 8 constructs)',
                errorEmpty: 'File is empty or invalid',
                errorFormat: 'Only .csv, .xlsx, .xls supported',
                errorRead: 'Error reading file',
                errorSample: 'Sample file not found'
            },
            profile: {
                title: 'Data Quality Report',
                desc: 'Verify and confirm data before proceeding to analysis',
                proceed: 'Proceed to Analysis',
                summary: {
                    rows: 'Total Rows',
                    cols: 'Columns',
                    issues: 'Issues Detected'
                },
                issues: {
                    title: 'Data Quality Issues',
                    allData: 'All data',
                    countLabel: 'values/rows'
                },
                table: {
                    title: 'Column Statistics',
                    colName: 'Column Name',
                    type: 'Type',
                    missing: 'Missing',
                    mean: 'Mean',
                    sd: 'SD',
                    min: 'Min',
                    max: 'Max'
                }
            },
            methods: {
                descriptive: 'Descriptive Statistics',
                cronbach: "Cronbach's Alpha Reliability",
                omega: "McDonald's Omega Reliability",
                ttest: 'Independent T-test',
                ttest_paired: 'Paired T-test',
                anova: 'ANOVA / Welch Analysis',
                correlation: 'Correlation Matrix',
                regression: 'Linear Regression',
                mediation: 'Mediation Analysis',
                moderation: 'Moderation Analysis',
                efa: 'Exploratory Factor Analysis (EFA)',
                cfa: 'Confirmatory Factor Analysis (CFA)',
                sem: 'Structural Equation Modeling (SEM)',
                chisq: 'Chi-Square Test',
                cluster: 'Cluster Analysis',
                methods_count: 'methods'
            },
            selector: {
                title: 'Select Analysis Method',
                desc: 'Choose the most appropriate method for your research objectives'
            },
            results: {
                title: 'Analysis Results',
                back: 'Other Analysis',
                exportPdf: 'Export PDF',
                exportWord: 'Export Word',
                newAnalysis: 'New Analysis'
            },
            common: {
                back: 'Back',
                continue: 'Continue',
                processing: 'Processing...',
                analyzing: 'Analyzing...',
                security: 'Data processed 100% locally (Client-side), ensuring absolute privacy.',
                authenticating: 'Authenticating...',
                engine_ready: 'Computation engine is ready!',
                engine_error: 'Computation engine initialization failed. Please reload page.',
                restored_session: 'We found unsaved content from a previous session.',
                restore_now: 'Restore Now',
                discard_session: 'Discard',
                session_cleared: 'Session data cleared',
                security_label: 'Security',
                restored_success: 'Previous session restored successfully!',
                data_cleared: 'Saved data has been cleared.',
                internet_restored: 'Internet connection restored!',
                internet_lost: 'Internet connection lost. Some features may not work.',
                engine_initializing: 'Initializing R Engine...',
                working: 'Working',
                file_too_large: 'File too large (>50,000 rows). Please reduce file size.',
                analysis_complete: 'Analysis completed!'
            }
        },
        // PLS-SEM Workflow Pages
        pls_workflow: {
            title: 'PLS-SEM Workflow',
            security: 'Data Privacy: 100% Client-side processing.',
            phases: {
                phase1: {
                    title: 'Pre-processing & Reliability',
                    desc: 'Data cleaning and scale reliability assessment (The Foundation)'
                },
                phase2: {
                    title: 'Measurement Validation',
                    desc: 'Convergent and discriminant validity assessment (Measurement Model)'
                },
                phase3: {
                    title: 'Structural Model',
                    desc: 'Hypothesis testing and path analysis (Structural Model)'
                },
                phase4: {
                    title: 'Advanced Analysis',
                    desc: 'Deep dive into research findings (Advanced Analysis)'
                }
            }
        },
        // Results Tables (Bilingual)
        tables: {
            variable: 'Variable',
            mean: 'Mean',
            sd: 'SD',
            min: 'Min',
            max: 'Max',
            skew: 'Skewness',
            kurtosis: 'Kurtosis',
            median: 'Median',
            n: 'N',
            sig: 'Sig.',
            model: 'Model',
            coefficients: 'Coefficients',
            summary: 'Model Summary',
            anova: 'ANOVA',
            correlations: 'Correlations',
            reliability: 'Reliability Statistics',
            itemTotal: 'Item-Total Statistics',
            alpha: "Cronbach's Alpha",
            standardized: 'Standardized',
            unstandardized: 'Unstandardized',
            tolerance: 'Tolerance',
            vif: 'VIF',
            source: 'Source'
        },
        // Scale Hub
        scales: {
            title: 'Standardized Scale Hub',
            subtitle: 'Repository of validated and accurately translated research constructs.',
            searchPlaceholder: 'Search scales (e.g., TAM, SERVQUAL...)',
            categories: 'Categories',
            economics: 'Economics',
            marketing: 'Marketing',
            hr: 'Human Resources',
            logistics: 'Logistics & SCM',
            mis: 'MIS & Digital',
            accounting: 'Accounting & Finance',
            innovation: 'Innovation & Strategy',
            tourism: 'Tourism & Hospitality',
            psychology: 'Psychology',
            'modern (2020+)': 'Modern Research (2020+)',
            author: 'Author',
            year: 'Year',
            items: 'Items',
            citation: 'Citation',
            viewItems: 'View Scale Items',
            exportTemplate: 'Export Excel Template',
            comingSoon: 'Coming Soon',
            advisor: {
                title: 'Research Advisor',
                subtitle: 'Let the system suggest a theory for you:',
                q1: 'What is your research objective?',
                q2: 'Who is your target focus?',
                opt1: 'Measuring acceptance / new behavior',
                opt2: 'Evaluating service quality / performance',
                opt3: 'Analyzing HR / Organization / Leadership',
                opt4: 'Logistics Systems & MIS Management',
                modern: 'Modern Research (AI/Digital/Hybrid)',
                resultText: 'Based on your goal, we recommend:',
                loginRequired: 'Please login to view scale items'
            }
        },
        // Docs Page
        docs: {
            tabs: {
                theory: 'Statistical Theory',
                casestudy: 'Research Scenarios',
                userguide: 'User Guide'
            },
            theory: {
                title: 'Statistical Foundations and Interpretation',
                subtitle: 'In-depth analysis of key concepts to support scientific data interpretation.'
            },
            casestudy: {
                title: 'Research Workflow and International Publication',
                subtitle: 'Guidance on coordinating analysis methods to complete an APA-standard research paper.'
            },
            userguide: {
                title: 'ncsStat System Operation Guide',
                subtitle: 'Detailed operational steps for each analysis and data processing feature.'
            },
            casestudy_content: {
                model_badge: 'Economics Model',
                scenario_title: 'Scenario: Factors influencing Digital Banking Intention',
                scenario_desc: 'This study applies the Technology Acceptance Model (TAM) combined with Trust and Perceived Risk factors to explain consumer behavior in the Vietnamese financial sector.',
                stats: {
                    sample: '320 Quantitative Sample',
                    scale: '5-point Likert Scale',
                    analysis: 'PLS-SEM Analysis'
                },
                phase1: {
                    title: 'Phase 1: Pre-processing & Descriptive Statistics',
                    desc: 'Checking for outliers and missing values. Presenting sample demographics across age, income, and education levels.',
                    report_label: 'Key reporting indicators:'
                },
                phase2: {
                    title: 'Phase 2: Reliability & Convergent Validity',
                    desc: "Running Cronbach's Alpha and C.R for each factor. Checking Outer Loadings to ensure observed variables accurately measure concepts.",
                    pass: 'Requirements:',
                    note: 'Item removal notes:',
                    note_desc: 'Remove items with loadings < 0.40 or those negatively impacting AVE.'
                },
                phase3: {
                    title: 'Phase 3: Discriminant Validity (HTMT)',
                    desc: 'Proving that research constructs do not overlap using the Heterotrait-Monotrait Ratio (HTMT) matrix.',
                    example: '"The HTMT index between Perceived Risk and Usage Intention reached 0.76 (below the 0.85 threshold), confirming discriminant validity."'
                },
                phase4: {
                    title: 'Phase 4: Hypothesis Testing & Structural Analysis',
                    desc: 'Analyzing Path Coefficients via Bootstrapping (5000 iterations). Checking R-square to evaluate model explanatory power.',
                    hypothesis: 'Expected Results (Hypothesis):',
                    supported: 'Supported',
                    explanation_power: 'Explanatory Power:',
                    explanation_desc: 'Variance of Usage Intention explained by the model.'
                },
                tips: {
                    title: 'Guidelines for Thesis / Journal Presentation',
                    tip1: 'Report measurement model results first (Reliability, Convergent, Discriminant validity), then report structural model results.',
                    tip2: 'Use Path Diagrams exported from ncsStat to visually illustrate effect coefficients and significance levels.',
                    tip3: 'For mediating variables, specifically report Direct Effect, Indirect Effect, and Total Effect.'
                },
                scenarios: {
                    digital: {
                        name: 'Digital & AI',
                        title: 'Impact of AI on SME Operational Efficiency',
                        desc: 'Quantitative research evaluating the role of Artificial Intelligence in optimizing predictive maintenance and supply chain management.'
                    },
                    marketing: {
                        name: 'Marketing & E-commerce',
                        title: 'Gen Z Loyalty in E-commerce Platforms',
                        desc: 'Analyzing Personalization, Entertainment Value, and Trust factors influencing repeat purchase behavior on Shopee/TikTok Shop.'
                    },
                    tourism: {
                        name: 'Tourism & Hospitality',
                        title: 'Sustainable Tourism Intentions at National Parks',
                        desc: 'Extending the Theory of Planned Behavior (TPB) with "Environmental Responsibility" to explain eco-tourism participation intentions.'
                    },
                    economics: {
                        name: 'Economics',
                        title: 'Digital Economy and Export Growth in Vietnam',
                        desc: 'Using secondary data and multivariate regression to assess the contribution of IT infrastructure to export turnover.'
                    }
                }
            },
            theory_content: {
                measurement_title: '1. Measurement Model Evaluation',
                reliability_title: 'Internal Consistency Reliability',
                reliability_desc: "Using Cronbach's Alpha and C.R (Composite Reliability). In modern research, C.R is preferred as it is not affected by the number of items.",
                convergent_title: 'Convergent Validity (AVE)',
                convergent_desc: 'AVE (Average Variance Extracted) measures the percentage of variance explained by a factor from its indicators. Low AVE indicates indicators do not reflect the factor well.',
                threshold: 'Threshold:',
                discriminant_title: 'Discriminant Validity',
                htmt_title: 'HTMT Index (Heterotrait-Monotrait)',
                htmt_desc: 'The most rigorous current standard. Measures the ratio of between-trait correlations to within-trait correlations.',
                htmt_threshold: 'Pass: HTMT < 0.85 or 0.90',
                fornell_title: 'Fornell-Larcker Criterion',
                fornell_desc: "The square root of each factor's AVE must be greater than its correlations with any other factor.",
                structural_title: '2. Structural Model Evaluation',
                rsquare_title: 'R-Square (R)',
                rsquare_desc: 'Measures the explanatory power of the model. In social sciences, an R above 0.26 is considered a large effect.',
                fsquare_title: 'f-Square (f)',
                fsquare_desc: 'Effect size. Helps determine the role of each independent variable in contributing to the R of the dependent variable.',
                qsquare_title: 'Q-Square (Q)',
                qsquare_desc: 'Predictive relevance out-of-sample. Calculated via the Blindfolding technique.',
                mediation_title: 'Indirect & Mediating Effects',
                mediation_desc: 'ncsStat supports mediation testing via the Bootstrapping method. To conclude on mediation, one must check the Confidence Interval. If it does not contain zero, the mediation effect is statistically significant.',
                sig_title: 'Statistical Significance (Sig.)',
                sig_desc: 'p-value determines the probability that a finding was obtained by chance. In social sciences, the common threshold is 5%.',
                beta_title: 'Beta Coefficients (Path Coefficients)',
                beta_desc: 'Indicates the amount of change in the dependent variable when an independent variable changes by one unit. Beta can be positive (+) or negative (-).',
                beta_pos: 'Positive Beta: Same direction impact (A increases leads to B increases).',
                beta_neg: 'Negative Beta: Inverse direction impact (A increases leads to B decreases).',
                beta_std: 'Standardized Beta: Used to compare the strength of impact between variables with different units of measurement.',
                cta_title: 'Knowledge is the Foundation of Publication',
                cta_desc: 'A deep understanding of these indicators helps your research pass through peer review and affirms your scientific credibility.',
                cta_button: 'See Research Scenarios',
                troubleshooting: {
                    title: 'Troubleshooting & FAQ',
                    q1: 'What if AVE is lower than 0.5?',
                    a1: 'Check Outer Loadings. Remove items with low loadings (< 0.4) or remove items one by one starting from the lowest until AVE reaches the threshold.',
                    q2: 'How does high VIF (> 5) affect the model?',
                    a2: 'It indicates multi-collinearity. You should merge highly correlated variables or remove the one with the highest VIF to clean the model.',
                    q3: 'Got "Singular Matrix" error in EFA/CFA?',
                    a3: 'Usually caused by perfectly correlated variables (r=1) or excessive missing data. Check the correlation matrix before running.'
                }
            }
        },
        methods_guide: {
            title: 'Statistical Methods Guide',
            select: 'Select a method to view detailed instructions',
            cta: 'Execute Now',
            descriptive: {
                name: 'Descriptive Statistics',
                desc: 'Summarize data characteristics (Mean, SD, Skewness...)',
                purpose: 'Summarizes basic characteristics of data such as Mean, Median, Standard Deviation, Min, Max, Skewness, Kurtosis.',
                stepTitle: 'How to perform:',
                whenToUse: 'Always run first to check distributions and find anomalies.',
                steps: [
                    'Select the Descriptive menu.',
                    'Select numeric variables for calculation.',
                    'Click the Run Analysis button.'
                ],
                output: ['Mean, SD, Min, Max', 'Skewness & Kurtosis']
            },
            cronbach: {
                name: "Cronbach's Alpha",
                desc: 'Scale reliability testing',
                purpose: 'Evaluates the internal consistency of scale items (how closely related they are).',
                stepTitle: 'How to perform:',
                whenToUse: 'Validate scale quality before factor analysis.',
                steps: [
                    "Select the Cronbach's Alpha menu.",
                    'Select all indicators belonging to the same construct.',
                    'Click the Run Analysis button.'
                ],
                note: "Results will show the overall Cronbach's Alpha and the 'Item-Total Statistics' table to help identify problematic items.",
                output: ['Alpha coefficient', 'Alpha if item deleted']
            },
            efa: {
                name: 'EFA Analysis',
                desc: 'Exploratory Factor Analysis',
                purpose: 'Reduces a large set of variables into a smaller number of meaningful factors.',
                stepTitle: 'How to perform:',
                whenToUse: 'Discover scale structure or reduce data dimensionality.',
                steps: [
                    'Select the EFA menu.',
                    'Select all relevant observation variables.',
                    'Adjust settings if needed: Extraction, Rotation.',
                    'Click the Run EFA button.'
                ],
                output: ['KMO & Bartlett', 'Rotated factor matrix']
            },
            ttest: {
                name: 'T-Test',
                desc: 'Compare means of 2 groups',
                purpose: 'Tests whether there is a statistically significant difference between the means of two independent groups.',
                stepTitle: 'How to perform:',
                steps: [
                    'Select the T-Test menu.',
                    'Select the grouping variable (e.g., Gender).',
                    'Select the test variable (e.g., Income).',
                    'Click the Run T-Test button.'
                ]
            },
            anova: {
                name: 'ANOVA Test',
                desc: 'Compare means of 3+ groups',
                purpose: 'Tests differences in means across three or more groups (One-Way ANOVA).',
                stepTitle: 'How to perform:',
                steps: [
                    'Select the ANOVA menu.',
                    'Select the grouping Factor variable (e.g., Education).',
                    'Select the Dependent variable.',
                    'Click the Run ANOVA button.'
                ]
            },
            correlation: {
                name: 'Correlation Analysis',
                desc: 'Pearson Correlation',
                purpose: 'Evaluates linear relationships between two quantitative variables.',
                stepTitle: 'How to perform:',
                steps: [
                    'Select the Correlation menu.',
                    'Select variables for correlation analysis.',
                    'Click the Run Analysis button.'
                ]
            },
            regression: {
                name: 'Regression Analysis',
                desc: 'Linear Regression',
                purpose: 'Evaluates the impact of one or more independent variables on a dependent variable.',
                stepTitle: 'How to perform:',
                whenToUse: 'Testing causal hypotheses.',
                steps: [
                    'Select the Regression menu.',
                    'Select the Dependent variable (Y).',
                    'Select Independent variables (X).',
                    'Click the Run Regression button.'
                ],
                note: 'The system automatically calculates R-squared, Beta coefficients, and checks for multicollinearity (VIF).',
                output: ['R-Square', 'Beta coefficients']
            },
            chisq: {
                name: 'Chi-Square Test',
                desc: 'Test for categorical variables',
                purpose: 'Examines the association between two categorical variables.',
                stepTitle: 'How to perform:',
                steps: [
                    'Select the Chi-Square menu.',
                    'Select Row and Column variables.',
                    'Click the Run Test button.'
                ]
            },
            nonparam: {
                name: 'Non-parametric Tests',
                desc: 'Mann-Whitney / Kruskal-Wallis',
                purpose: 'Compares ranks when data is not normally distributed (Alternative to T-Test/ANOVA).',
                stepTitle: 'How to perform:',
                steps: [
                    'Select the Non-parametric menu.',
                    'Select test variables and the grouping variable.',
                    'Click the Run Test button.'
                ]
            }
        },
        methods_guide_labels: {
            basic: 'Basic',
            measurement: 'Measurement',
            structure: 'Structure',
            comparison: 'Comparison',
            relationship: 'Relationship',
            categorical: 'Categorical',
            advanced: 'Advanced',
            scientific_standard: 'Scientific Standard',
            r_engine: 'R-ENGINE ACTIVATED',
            purpose_utility: 'PURPOSE & UTILITY',
            expert_insights: 'Expert Insights',
            realtime_processing: 'Real-time processing enabled',
            researches_done: '+2,400 researches done',
            apa_report_note: 'Use APA 7 standards for reporting results for this method.'
        }
    };
