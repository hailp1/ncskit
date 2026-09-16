import { NextRequest, NextResponse } from "next/server";
import { generateInterpretation } from "@/lib/asig/generator";
import { AnalysisType } from "@/lib/asig/shared";

/**
 * Model Context Protocol (MCP) Server Endpoint for ASIG Engine.
 * 
 * This endpoint allows external AI Agents (Claude, ChatGPT, Cursor, etc.) to 
 * execute the ASIG engine deterministically without hallucinating statistical results.
 * It implements the standard JSON-RPC 2.0 interface for MCP Tools.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Handle MCP ListTools Request
        if (body.method === "tools/list") {
            return NextResponse.json({
                jsonrpc: "2.0",
                id: body.id,
                result: {
                    tools: [{
                        name: "generate_apa_interpretation",
                        description: "Generate deterministic APA 7th Edition statistical interpretation from raw analysis results using the NCSKit ASIG Engine. Guaranteed zero hallucination.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                analysisType: {
                                    type: "string",
                                    description: "The type of analysis (e.g. cronbach_alpha, pls-sem, descriptive, correlation, ttest_independent, anova, linear_regression, etc.)"
                                },
                                results: {
                                    type: "object",
                                    description: "The raw JSON results from the R analysis to be interpreted."
                                }
                            },
                            required: ["analysisType", "results"]
                        }
                    }]
                }
            });
        }

        // 2. Handle MCP CallTool Request
        if (body.method === "tools/call") {
            const { name, arguments: args } = body.params;
            
            if (name === "generate_apa_interpretation") {
                const { analysisType, results } = args;
                
                try {
                    const interpretation = generateInterpretation(analysisType as AnalysisType, results);
                    return NextResponse.json({
                        jsonrpc: "2.0",
                        id: body.id,
                        result: {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(interpretation, null, 2)
                                }
                            ]
                        }
                    });
                } catch (execError: any) {
                    return NextResponse.json({
                        jsonrpc: "2.0",
                        id: body.id,
                        result: {
                            isError: true,
                            content: [
                                {
                                    type: "text",
                                    text: `ASIG Engine Error: ${execError.message}`
                                }
                            ]
                        }
                    });
                }
            }

            return NextResponse.json({
                jsonrpc: "2.0",
                id: body.id,
                error: { code: -32601, message: `Tool not found: ${name}` }
            }, { status: 404 });
        }

        // 3. Fallback for unknown methods
        return NextResponse.json({
            jsonrpc: "2.0",
            id: body.id,
            error: { code: -32601, message: `Method not found: ${body.method}` }
        }, { status: 404 });

    } catch (error: any) {
        return NextResponse.json({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error or execution failed: " + error.message }
        }, { status: 500 });
    }
}
