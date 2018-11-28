const EVENTS_PREFIX = 'acmebots';

module.exports = {
    EVENTS_PREFIX            : EVENTS_PREFIX,
    CONNECTIVITY_EVENT_SOURCE: `${EVENTS_PREFIX}.connectivity`,
    STATUS_EVENT_SOURCE      : `${EVENTS_PREFIX}.status`,

    METRICS_NAMESPACE            : 'AcmeBots',
    TELEMETRY_DELAY_METRIC       : 'telemetryDelay',
    TELEMETRY_PACKAGE_SIZE_METRIC: 'telemetryPacketSize',
    BATTERY_LIFE_METRIC          : 'batteryLife',
}