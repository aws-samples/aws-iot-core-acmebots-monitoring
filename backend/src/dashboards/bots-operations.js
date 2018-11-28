var dashboard = {
    "widgets": [
        {
            "type": "metric",
            "x": 12,
            "y": 1,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${self:custom.backend.metricNameSpace}", "batteryLife", "bot", "bot1" ],
                    [ "...", "bot2" ],
                    [ "...", "bot3" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "#{AWS::Region}",
                "stat": "Average",
                "period": 1,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                },
                "annotations": {
                    "horizontal": [
                        {
                            "label": "Threshold",
                            "value": 15,
                            "fill": "below"
                        }
                    ]
                },
                "title": "BatteryLife"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 1,
            "width": 12,
            "height": 6,
            "properties": {
                "title": "LowBatteryBotsCountAlarm",
                "annotations": {
                    "alarms": [
                        "arn:aws:cloudwatch:#{AWS::Region}:#{AWS::AccountId}:alarm:${self:custom.backend.lowBatteryBotsCountAlarm}"
                    ]
                },
                "view": "timeSeries",
                "stacked": true
            }
        },
        {
            "type": "text",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 1,
            "properties": {
                "markdown": "\n# Bots Operations\n"
            }
        },
        {
            "type": "text",
            "x": 0,
            "y": 13,
            "width": 24,
            "height": 1,
            "properties": {
                "markdown": "\n# Custom Backend Operations\n"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 21,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${self:custom.backend.metricNameSpace}", "eventsDelay" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "#{AWS::Region}",
                "stat": "Maximum",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 14,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${self:custom.backend.metricNameSpace}", "telemetryDelay", "bot", "bot1" ],
                    [ "...", "bot2" ],
                    [ "...", "bot3" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "#{AWS::Region}",
                "period": 300,
                "stat": "Maximum"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 14,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "${self:custom.backend.metricNameSpace}", "telemetryPacketSize", "bot", "bot1" ],
                    [ "...", "bot2" ],
                    [ "...", "bot3" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "#{AWS::Region}",
                "period": 30,
                "stat": "Maximum"
            }
        },
        {
            "type": "text",
            "x": 0,
            "y": 20,
            "width": 24,
            "height": 1,
            "properties": {
                "markdown": "\n# CloudWatch Events Benchmarking\n"
            }
        },
        {
            "type": "text",
            "x": 0,
            "y": 27,
            "width": 24,
            "height": 1,
            "properties": {
                "markdown": "\n# AWS Services Metrics\n"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 7,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Events", "Invocations", "RuleName", "acme-bots-search-low-battery-bots" ],
                    [ ".", "TriggeredRules", ".", "." ],
                    [ "AWS/Lambda", "Invocations", "FunctionName", "acme-bots-dev-searchLowBatteryBots" ]
                ],
                "view": "timeSeries",
                "stacked": true,
                "region": "#{AWS::Region}",
                "period": 60,
                "title": "Search Low Battery Bots Scheduled Events",
                "stat": "Average"
            }
        }
    ]
};

module.exports.dashboard = () => {
    return JSON.stringify(dashboard);
}
