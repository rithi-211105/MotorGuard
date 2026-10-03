"""
severity_engine.py - Centralized Fault Severity & Maintenance Decision Engine
Maps AI predictions and feature metrics to fault severities (NORMAL, WARNING, CRITICAL),
human-readable descriptions, actionable recommendations, and prototype decision reasoning.
"""

import os
import sys

CLASS_HUMAN_NAMES = {
    'Normal_1': 'Healthy / Normal',
    'Ball_007_1': 'Ball Bearing Fault — 7 mil',
    'Ball_014_1': 'Ball Bearing Fault — 14 mil',
    'Ball_021_1': 'Ball Bearing Fault — 21 mil',
    'IR_007_1': 'Inner Race Fault — 7 mil',
    'IR_014_1': 'Inner Race Fault — 14 mil',
    'IR_021_1': 'Inner Race Fault — 21 mil',
    'OR_007_6_1': 'Outer Race Fault — 7 mil',
    'OR_014_6_1': 'Outer Race Fault — 14 mil',
    'OR_021_6_1': 'Outer Race Fault — 21 mil',
    'Normal Operation': 'Normal Operation',
    'Loose Foundation': 'Loose Motor Foundation',
    'Suboptimal Control (Speed Reg)': 'Suboptimal Speed Regulator Tuning',
    'Suboptimal Control (Speed+Current Reg)': 'Suboptimal Speed & Current Regulator Tuning',
}

def get_fault_severity(predicted_class: str, confidence: float, features: dict = None) -> dict:
    """
    Evaluates AI model prediction and confidence using backend prototype decision rules.
    
    Returns structured decision output:
    {
        "severity": "NORMAL" | "WARNING" | "CRITICAL",
        "human_readable_fault": "...",
        "action_summary": "...",
        "recommendation": "...",
        "reasoning": "...",
        "rule_label": "Prototype Decision Rules"
    }
    """
    features = features or {}
    human_name = CLASS_HUMAN_NAMES.get(predicted_class, predicted_class)
    conf_pct = round(confidence * 100, 1)
    rms_val = features.get('rms', 0.0)

    # 0. DC MOTOR CONDITIONS
    if predicted_class == 'Normal Operation':
        return {
            "severity": "NORMAL",
            "human_readable_fault": "Normal Operation",
            "action_summary": "Continue normal operation",
            "recommendation": "No maintenance required. All motor electrical and mechanical metrics are within nominal operating bounds.",
            "reasoning": f"AI model detected nominal DC motor operating state with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }
    elif predicted_class == 'Loose Foundation':
        return {
            "severity": "WARNING",
            "human_readable_fault": "Loose Motor Foundation",
            "action_summary": "Inspect mounting hardware and foundation",
            "recommendation": "WARNING: Loose motor foundation / mechanical looseness detected. Inspect mounting hardware and foundation fastening.",
            "reasoning": f"AI model detected mechanical looseness signature with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }
    elif predicted_class == 'Suboptimal Control (Speed Reg)':
        return {
            "severity": "WARNING",
            "human_readable_fault": "Suboptimal Speed Regulator Tuning",
            "action_summary": "Inspect speed regulator tuning",
            "recommendation": "WARNING: Suboptimal speed regulator gain setting detected. Inspect drive controller parameters and speed regulator tuning.",
            "reasoning": f"AI model detected speed regulator detuning with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }
    elif predicted_class == 'Suboptimal Control (Speed+Current Reg)':
        return {
            "severity": "CRITICAL",
            "human_readable_fault": "Suboptimal Speed & Current Regulator Tuning",
            "action_summary": "Inspect speed and current regulator tuning",
            "recommendation": "CRITICAL: Suboptimal speed and current regulator gain settings detected. Inspect drive controller parameters and calibrate gain settings.",
            "reasoning": f"AI model detected severe control loop detuning with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }

    # 1. NORMAL HEALTHY CWRU CONDITION
    if predicted_class == 'Normal_1':
        return {
            "severity": "NORMAL",
            "human_readable_fault": human_name,
            "action_summary": "Continue normal operation",
            "recommendation": "No maintenance required. All motor vibration metrics are within nominal operating bounds.",
            "reasoning": f"AI model detected baseline healthy pattern with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }

    # 2. SEVERE FAULTS (0.021" defects or high RMS acceleration)
    if '021' in predicted_class or rms_val > 0.50:
        return {
            "severity": "CRITICAL",
            "human_readable_fault": human_name,
            "action_summary": "Immediate bearing inspection and replacement",
            "recommendation": f"CRITICAL: {human_name} detected. Schedule immediate bearing inspection and replacement within 24 hours.",
            "reasoning": f"AI model classified severe fault pattern ({predicted_class}) with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }

    # 3. MODERATE FAULTS (0.014" defects)
    if '014' in predicted_class:
        if confidence >= 0.95 or rms_val > 0.35:
            severity = "CRITICAL"
            action = "Urgent bearing inspection"
            recommendation = f"CRITICAL: {human_name} detected with high confidence ({conf_pct}%). Schedule bearing inspection within 24 hours."
        else:
            severity = "WARNING"
            action = "Schedule bearing inspection within 24–48 hours"
            recommendation = f"WARNING: {human_name} detected. Monitor temperature trends and schedule inspection within 24–48 hours."
            
        return {
            "severity": severity,
            "human_readable_fault": human_name,
            "action_summary": action,
            "recommendation": recommendation,
            "reasoning": f"AI model classified moderate fault pattern ({predicted_class}) with {conf_pct}% confidence.",
            "rule_label": "Prototype Decision Rules"
        }

    # 4. MILD FAULTS (0.007" defects)
    return {
        "severity": "WARNING",
        "human_readable_fault": human_name,
        "action_summary": "Monitor & schedule routine inspection",
        "recommendation": f"WARNING: {human_name} detected. Monitor vibration trends and schedule inspection during next planned shift.",
        "reasoning": f"AI model classified early-stage bearing defect ({predicted_class}) with {conf_pct}% confidence.",
        "rule_label": "Prototype Decision Rules"
    }

if __name__ == '__main__':
    print("Normal  :", get_fault_severity("Normal_1", 0.99))
    print("Ball 014:", get_fault_severity("Ball_014_1", 0.99))
    print("IR 021  :", get_fault_severity("IR_021_1", 0.99))
